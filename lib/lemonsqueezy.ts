import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

const ACCESS_COOKIE = "tct_access";
const ACCESS_TTL_DAYS = 31;

export function getStripePaymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}

export function getBillingSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "dev-local-secret";
}

export function createAccessToken(email: string): string {
  const payload = `${email.toLowerCase()}|${Date.now()}`;
  const signature = createHmac("sha256", getBillingSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${signature}`, "utf-8").toString("base64url");
}

export function verifyAccessToken(token: string | undefined): { valid: boolean; email?: string } {
  if (!token) {
    return { valid: false };
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [email, issuedAt, signature] = decoded.split("|");
    if (!email || !issuedAt || !signature) {
      return { valid: false };
    }

    const payload = `${email}|${issuedAt}`;
    const expected = createHmac("sha256", getBillingSecret()).update(payload).digest("hex");

    const left = Buffer.from(signature, "utf-8");
    const right = Buffer.from(expected, "utf-8");

    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return { valid: false };
    }

    const ageMs = Date.now() - Number(issuedAt);
    const maxAgeMs = ACCESS_TTL_DAYS * 24 * 60 * 60 * 1000;

    if (!Number.isFinite(ageMs) || ageMs > maxAgeMs) {
      return { valid: false };
    }

    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}

export async function setAccessCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_TTL_DAYS * 24 * 60 * 60
  });
}

export async function clearAccessCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
}

export async function getAccessCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export function initLemonSqueezySdk(): void {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (apiKey) {
    lemonSqueezySetup({ apiKey, onError: () => undefined });
  }
}
