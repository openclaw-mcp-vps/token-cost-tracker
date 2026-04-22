import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, isAccessAllowed } from "@/lib/access";

export function requirePaidAccess(request: NextRequest): NextResponse | null {
  const ingestToken = request.headers.get("x-ingest-token");
  if (ingestToken && process.env.INGEST_API_TOKEN && ingestToken === process.env.INGEST_API_TOKEN) {
    return null;
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!isAccessAllowed(token)) {
    return NextResponse.json(
      { error: "Payment required. Unlock dashboard access first." },
      { status: 402 },
    );
  }

  return null;
}
