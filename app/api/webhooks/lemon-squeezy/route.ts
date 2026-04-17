import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertSubscription } from "@/lib/database";

function verifySignature(rawBody: string, signature: string, secret: string) {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(signature, "utf8");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature") ?? "";

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing." }, { status: 500 });
  }

  const rawBody = await request.text();

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta?: { event_name?: string };
    data?: {
      id?: string;
      attributes?: {
        user_email?: string;
        status?: string;
      };
    };
  };

  const orderId = payload.data?.id;

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const status = payload.data?.attributes?.status || payload.meta?.event_name || "paid";

  await upsertSubscription({
    lemonOrderId: orderId,
    email: payload.data?.attributes?.user_email,
    status
  });

  if (status.includes("paid") || status.includes("active")) {
    const cookieStore = await cookies();
    cookieStore.set("paid_access", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return NextResponse.json({ ok: true });
}
