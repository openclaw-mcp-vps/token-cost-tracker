import { createHmac, timingSafeEqual } from "node:crypto";
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export function setupLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "",
    onError: (error) => {
      console.error("Lemon Squeezy setup error", error);
    },
  });
}

export function getCheckoutUrl() {
  const product = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  if (!product) return "#";
  return `https://app.lemonsqueezy.com/checkout/buy/${product}?embed=1`;
}

export function verifyLemonWebhook(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}
