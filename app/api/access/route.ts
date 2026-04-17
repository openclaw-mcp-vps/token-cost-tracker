import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (token === "paid") {
    const cookieStore = await cookies();
    cookieStore.set("paid_access", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete("paid_access");
  }

  return NextResponse.redirect(new URL("/", request.url));
}
