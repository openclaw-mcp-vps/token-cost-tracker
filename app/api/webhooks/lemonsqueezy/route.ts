import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { upsertSubscription } from '@/lib/database';

async function verifySignature(secret: string, rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);
  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

function readActivationCode(payload: Record<string, unknown>) {
  const meta = payload.meta as Record<string, unknown> | undefined;
  const customData = meta?.custom_data as Record<string, unknown> | undefined;
  const fromMeta = customData?.activation_code;

  if (typeof fromMeta === 'string' && fromMeta.length >= 8) {
    return fromMeta;
  }

  return crypto.randomBytes(12).toString('hex');
}

export async function POST(request: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-signature');
  const rawBody = await request.text();

  const isValid = await verifySignature(secret, rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const data = payload.data as Record<string, unknown>;
  const attributes = data?.attributes as Record<string, unknown> | undefined;

  const orderId = String(data?.id ?? attributes?.order_id ?? 'unknown-order');
  const customerEmail = String(attributes?.user_email ?? attributes?.customer_email ?? 'unknown@example.com');
  const eventName = String(payload.meta ? (payload.meta as Record<string, unknown>).event_name ?? '' : '');

  const status = eventName.includes('subscription') || eventName.includes('order') ? 'active' : 'inactive';
  const activationCode = readActivationCode(payload);

  await upsertSubscription({
    lemonOrderId: orderId,
    customerEmail,
    status,
    activationCode,
  });

  return NextResponse.json({ ok: true, activationCode });
}
