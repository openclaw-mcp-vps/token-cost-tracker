import crypto from 'crypto';

const PAYWALL_COOKIE_NAME = 'tct_paid';

function getSecret() {
  return process.env.PAYWALL_COOKIE_SECRET || 'local-dev-secret-change-me';
}

export function signPaywallValue(value: string) {
  const hmac = crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
  return `${value}.${hmac}`;
}

export function verifyPaywallValue(signed: string | undefined) {
  if (!signed) {
    return false;
  }

  const [value, digest] = signed.split('.');
  if (!value || !digest) {
    return false;
  }

  const expected = crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
  const digestBuffer = Buffer.from(digest);
  const expectedBuffer = Buffer.from(expected);
  if (digestBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, expectedBuffer);
}

export function getPaywallCookieName() {
  return PAYWALL_COOKIE_NAME;
}
