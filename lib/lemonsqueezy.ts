import { createHmac, timingSafeEqual } from "node:crypto";

export interface StripeCheckoutInfo {
  email: string;
  checkoutSessionId: string;
  customerId: string | null;
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!signatureHeader || !webhookSecret) {
    return false;
  }

  const pieces = signatureHeader.split(",").map((entry) => entry.trim());
  const timestampPart = pieces.find((entry) => entry.startsWith("t="));
  const signatureParts = pieces.filter((entry) => entry.startsWith("v1="));

  if (!timestampPart || signatureParts.length === 0) {
    return false;
  }

  const timestamp = timestampPart.slice(2);
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  return signatureParts.some((entry) => {
    const candidate = entry.slice(3);
    if (candidate.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
  });
}

export function extractStripeCheckoutInfo(payload: unknown): StripeCheckoutInfo | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const event = payload as Record<string, unknown>;
  if (event.type !== "checkout.session.completed") {
    return null;
  }

  const data = event.data as Record<string, unknown> | undefined;
  const object = data?.object as Record<string, unknown> | undefined;
  if (!object) {
    return null;
  }

  const customerDetails = object.customer_details as Record<string, unknown> | undefined;
  const email =
    (typeof customerDetails?.email === "string" ? customerDetails.email : null) ??
    (typeof object.customer_email === "string" ? object.customer_email : null);

  if (!email) {
    return null;
  }

  const checkoutSessionId = typeof object.id === "string" ? object.id : `session-${Date.now()}`;
  const customerId = typeof object.customer === "string" ? object.customer : null;

  return {
    email: email.trim().toLowerCase(),
    checkoutSessionId,
    customerId,
  };
}
