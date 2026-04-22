import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "tct_paid_access";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSigningSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "local-dev-secret";
}

export function createAccessToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const exp = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;
  const payload = `${normalized}.${exp}`;
  const signature = createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAccessToken(token: string | null | undefined): {
  valid: boolean;
  email?: string;
} {
  if (!token) {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length < 3) {
    return { valid: false };
  }

  const email = parts.slice(0, parts.length - 2).join(".");
  const exp = Number(parts[parts.length - 2]);
  const signature = parts[parts.length - 1];

  if (!email || !Number.isFinite(exp)) {
    return { valid: false };
  }

  if (exp < Math.floor(Date.now() / 1000)) {
    return { valid: false };
  }

  const payload = `${email}.${exp}`;
  const expected = createHmac("sha256", getSigningSecret()).update(payload).digest("hex");

  if (expected.length !== signature.length) {
    return { valid: false };
  }

  const matches = timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  return matches ? { valid: true, email } : { valid: false };
}

export function isAccessAllowed(token: string | null | undefined): boolean {
  return verifyAccessToken(token).valid;
}
