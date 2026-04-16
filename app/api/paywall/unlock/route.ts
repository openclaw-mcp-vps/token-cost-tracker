import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { activateSubscription } from '@/lib/database';
import { getPaywallCookieName, signPaywallValue } from '@/lib/paywall';

const bodySchema = z.object({
  activationCode: z.string().min(8).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const code = parsed.data.activationCode || cookieStore.get('tct_activation_code')?.value;

  if (!code) {
    return NextResponse.json({ error: 'Missing activation code' }, { status: 400 });
  }

  const sub = await activateSubscription(code);
  if (!sub) {
    return NextResponse.json({ error: 'Purchase is not active yet. Confirm webhook delivery and try again.' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getPaywallCookieName(), signPaywallValue(`sub:${sub.id}`), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 31,
  });

  return response;
}
