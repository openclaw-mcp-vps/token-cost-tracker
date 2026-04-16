import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST() {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  if (!productId) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID is not configured' }, { status: 400 });
  }

  const activationCode = crypto.randomBytes(12).toString('hex');
  const checkoutUrl = `https://checkout.lemonsqueezy.com/buy/${productId}?checkout[custom][activation_code]=${activationCode}`;

  const response = NextResponse.json({ checkoutUrl, activationCode });
  response.cookies.set('tct_activation_code', activationCode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  return response;
}
