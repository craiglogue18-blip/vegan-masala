import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const ALLOWED_EVENTS = new Set([
  "dinner_plan_view",
  "dinner_plan_form_start",
  "dinner_plan_form_submit",
  "dinner_plan_confirmed",
  "dinner_plan_download",
  "affiliate_click",
]);

function redisClient() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function clean(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.toLowerCase().replace(/[^a-z0-9/_-]+/g, "-").slice(0, 100) || fallback;
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = typeof payload.event === "string" ? payload.event : "";
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const redis = redisClient();
  if (redis) {
    const dimensions = [
      event,
      clean(payload.pagePath, "unknown"),
      clean(payload.source, "none"),
      clean(payload.campaign, "none"),
      clean(payload.placement, "none"),
      clean(payload.category, "none"),
      clean(payload.product, "none"),
    ].join(":");
    const dailyKey = `engagement:${dayKey()}`;
    await Promise.all([
      redis.hincrby(dailyKey, dimensions, 1),
      redis.expire(dailyKey, 60 * 60 * 24 * 120),
      redis.hincrby("engagement:lifetime", dimensions, 1),
    ]);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
