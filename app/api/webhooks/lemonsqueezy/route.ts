import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/database/store";
import { verifyLemonWebhook } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(raw) as {
    meta?: { event_name?: string };
    data?: {
      id?: string;
      attributes?: {
        user_email?: string;
      };
    };
  };

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    return NextResponse.json({ status: "ignored" });
  }

  const orderId = payload.data?.id;
  const email = payload.data?.attributes?.user_email;
  if (!orderId || !email) {
    return NextResponse.json({ error: "Missing order data" }, { status: 400 });
  }

  const db = await readDb();
  const exists = db.purchases.some((p) => p.orderId === orderId || p.email === email);
  if (!exists) {
    db.purchases.push({
      orderId,
      email,
      createdAt: new Date().toISOString(),
    });
    await writeDb(db);
  }

  return NextResponse.json({ status: "ok" });
}
