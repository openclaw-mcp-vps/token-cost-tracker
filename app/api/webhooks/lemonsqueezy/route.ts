import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createAccessToken, getBillingSecret } from "@/lib/lemonsqueezy";
import { readDb, writeDb } from "@/lib/database";

const unlockSchema = z.object({
  action: z.literal("unlock"),
  email: z.string().email()
});

const webhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.object({
      customer_details: z
        .object({
          email: z.string().email().optional()
        })
        .optional(),
      customer_email: z.string().email().optional()
    })
  })
});

function secureCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf-8");
  const right = Buffer.from(b, "utf-8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function verifyStripeSignature(signatureHeader: string | null, payload: string, secret: string): boolean {
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  const toleranceSeconds = 300;

  if (!Number.isFinite(ts) || Math.abs(now - ts) > toleranceSeconds) {
    return false;
  }

  return signatures.some((signature) => secureCompare(signature, expected));
}

async function addEntitlement(email: string, source: "stripe_webhook" | "manual_dev") {
  await writeDb((db) => {
    const lowerEmail = email.toLowerCase();
    const exists = db.entitlements.some((item) => item.email.toLowerCase() === lowerEmail);

    if (exists) {
      return db;
    }

    return {
      ...db,
      entitlements: [
        ...db.entitlements,
        {
          email: lowerEmail,
          createdAt: new Date().toISOString(),
          source
        }
      ]
    };
  });
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  let body: unknown = {};

  if (bodyText.length > 0) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Webhook body is not valid JSON" }, { status: 400 });
    }
  }

  const maybeUnlock = unlockSchema.safeParse(body);
  if (maybeUnlock.success) {
    const email = maybeUnlock.data.email.toLowerCase();
    const db = await readDb();

    const hasEntitlement = db.entitlements.some((entry) => entry.email.toLowerCase() === email);

    if (!hasEntitlement && process.env.NODE_ENV !== "production") {
      await addEntitlement(email, "manual_dev");
    }

    const refreshed = await readDb();
    const entitled = refreshed.entitlements.some((entry) => entry.email.toLowerCase() === email);

    if (!entitled) {
      return NextResponse.json(
        {
          error:
            "No paid subscription found for this email yet. If you just paid, wait a minute and try again after Stripe webhook delivery completes."
        },
        { status: 403 }
      );
    }

    const token = createAccessToken(email);
    const response = NextResponse.json({ success: true });
    response.cookies.set("tct_access", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 31 * 24 * 60 * 60
    });

    return response;
  }

  const signature = request.headers.get("stripe-signature");
  const expected = request.headers.get("x-token-cost-tracker-signature");
  const secret = getBillingSecret();

  const isValid =
    verifyStripeSignature(signature, bodyText, secret) ||
    (expected && secureCompare(expected, secret)) ||
    (process.env.NODE_ENV !== "production" && !signature && !expected);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const event = webhookSchema.safeParse(body);

  if (!event.success) {
    return NextResponse.json({ error: "Invalid webhook payload", details: event.error.flatten() }, { status: 400 });
  }

  const email =
    event.data.data.object.customer_details?.email?.toLowerCase() ?? event.data.data.object.customer_email?.toLowerCase();

  if (!email) {
    return NextResponse.json({ received: true, ignored: "Missing customer email" });
  }

  if (event.data.type === "checkout.session.completed") {
    await addEntitlement(email, "stripe_webhook");
  }

  return NextResponse.json({ received: true });
}
