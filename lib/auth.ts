import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "tct_paid";
const TTL_MS = 1000 * 60 * 60 * 24 * 32;

function getSecret() {
  return process.env.PAYWALL_COOKIE_SECRET ?? "local-dev-secret";
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createAccessCookieValue(email: string) {
  const exp = Date.now() + TTL_MS;
  const payload = `${email}:${exp}`;
  const sig = signPayload(payload);
  return `${payload}:${sig}`;
}

export function verifyAccessCookieValue(raw?: string | null) {
  if (!raw) return { valid: false, email: null as string | null };
  const [email, expString, signature] = raw.split(":");
  if (!email || !expString || !signature) return { valid: false, email: null as string | null };
  const payload = `${email}:${expString}`;
  const expected = signPayload(payload);
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, email: null as string | null };
  }
  const exp = Number(expString);
  if (Number.isNaN(exp) || Date.now() > exp) return { valid: false, email: null as string | null };
  return { valid: true, email };
}

export async function hasDashboardAccess() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  return verifyAccessCookieValue(raw).valid;
}

export const PAYWALL_COOKIE_NAME = COOKIE_NAME;
