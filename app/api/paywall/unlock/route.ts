import { NextResponse } from "next/server";
import { z } from "zod";
import { createAccessCookieValue, PAYWALL_COOKIE_NAME } from "@/lib/auth";
import { readDb } from "@/lib/database/store";

const UnlockSchema = z.object({
  email: z.string().email(),
  orderId: z.string().min(2),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = UnlockSchema.safeParse({
    email: form.get("email"),
    orderId: form.get("orderId"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/?unlock=invalid", request.url));
  }

  const { email, orderId } = parsed.data;
  const db = await readDb();
  const match = db.purchases.some((p) => p.email.toLowerCase() === email.toLowerCase() && p.orderId === orderId);
  if (!match) {
    return NextResponse.redirect(new URL("/?unlock=not-found", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set(PAYWALL_COOKIE_NAME, createAccessCookieValue(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 32,
  });
  return response;
}
