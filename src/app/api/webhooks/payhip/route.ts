import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

type PayhipPayload = {
  id?: unknown;
  type?: unknown;
  price?: unknown;
  currency?: unknown;
  signature?: unknown;
  items?: Array<{ product_name?: unknown }>;
};

function redisClient() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function clean(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.toLowerCase().replace(/[^a-z0-9/_-]+/g, "-").slice(0, 100) || fallback;
}

function row(event: string, currency: string, product: string) {
  return [event, "/store", "payhip", "commerce", "none", "webhook", currency, product, "/store", "server"].join(":");
}

export async function POST(request: Request) {
  const apiKey = process.env.PAYHIP_API_KEY?.trim();
  const redis = redisClient();
  if (!apiKey || !redis) return NextResponse.json({ ok: false }, { status: 503 });

  let payload: PayhipPayload;
  try {
    payload = await request.json() as PayhipPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = crypto.createHash("sha256").update(apiKey).digest("hex");
  const supplied = typeof payload.signature === "string" ? payload.signature : "";
  if (!safeEqual(supplied, expected)) return NextResponse.json({ ok: false }, { status: 401 });

  const type = payload.type === "paid" ? "payhip_purchase" : payload.type === "refunded" ? "payhip_refund" : "";
  if (!type) return NextResponse.json({ ok: true, ignored: true });

  const orderId = clean(payload.id, "unknown");
  const accepted = await redis.set(`payhip:event:${type}:${orderId}`, "1", { nx: true, ex: 60 * 60 * 24 * 365 });
  if (!accepted) return NextResponse.json({ ok: true, duplicate: true });

  const currency = clean(payload.currency, "gbp");
  const product = clean(payload.items?.[0]?.product_name, "product");
  const price = Math.max(0, Math.round(Number(payload.price) || 0));
  const dailyKey = `engagement:${new Date().toISOString().slice(0, 10)}`;
  const valueEvent = type === "payhip_purchase" ? "payhip_revenue" : "payhip_refund_value";
  await Promise.all([
    redis.hincrby(dailyKey, row(type, currency, product), 1),
    redis.hincrby(dailyKey, row(valueEvent, currency, product), price),
    redis.expire(dailyKey, 60 * 60 * 24 * 120),
  ]);

  return NextResponse.json({ ok: true });
}
