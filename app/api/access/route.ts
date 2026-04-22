import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ACCESS_COOKIE_NAME, createAccessToken } from "@/lib/access";
import { hasEntitlement, readStore } from "@/lib/database";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

function makeAccessResponse(email: string): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: "Purchase verified. Dashboard access unlocked.",
  });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: createAccessToken(email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = (await request.json()) as unknown;
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid checkout email is required." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const entitled = await hasEntitlement(email);

  if (entitled) {
    return makeAccessResponse(email);
  }

  // In development, allow quick evaluation when no webhook has been received yet.
  if (process.env.NODE_ENV !== "production") {
    const store = await readStore();
    if (store.entitlements.length === 0) {
      return makeAccessResponse(email);
    }
  }

  return NextResponse.json(
    {
      error:
        "No completed Stripe checkout found for that email yet. If you just paid, wait a few seconds and retry.",
    },
    { status: 403 },
  );
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
