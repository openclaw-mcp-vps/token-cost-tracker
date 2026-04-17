import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const storeId = Number(process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID ?? "");
  const productId = Number(process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID ?? "");
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!storeId || !productId || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing Lemon Squeezy config. Set NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID, NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID, and LEMON_SQUEEZY_API_KEY."
      },
      { status: 400 }
    );
  }

  lemonSqueezySetup({ apiKey, onError: undefined });

  const embed = request.nextUrl.origin;

  const checkout = await createCheckout(storeId, productId, {
    checkoutOptions: {
      embed: true,
      media: true,
      logo: true
    },
    checkoutData: {
      custom: {
        app: "token-cost-tracker"
      }
    },
    productOptions: {
      redirectUrl: `${embed}/api/access?token=paid`
    }
  });

  const checkoutUrl = checkout.data?.data?.attributes?.url;

  if (!checkoutUrl) {
    return NextResponse.json({ error: "Unable to generate checkout link." }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl });
}
