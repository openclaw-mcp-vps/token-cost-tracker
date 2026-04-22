import { NextRequest, NextResponse } from "next/server";

import { addEntitlement } from "@/lib/database";
import { extractStripeCheckoutInfo, verifyStripeWebhookSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

// Kept at /api/webhooks/lemonsqueezy for backwards compatibility with existing webhook routing.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const signatureHeader = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  const valid = verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as unknown;
  const checkout = extractStripeCheckoutInfo(payload);

  if (!checkout) {
    return NextResponse.json({ received: true, ignored: true });
  }

  await addEntitlement({
    email: checkout.email,
    source: "stripe_webhook",
    checkoutSessionId: checkout.checkoutSessionId,
    customerId: checkout.customerId,
    purchasedAt: new Date().toISOString(),
  });

  return NextResponse.json({ received: true, email: checkout.email });
}
