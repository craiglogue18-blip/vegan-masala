import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const ALLOWED_EVENTS = new Set([
  "dinner_plan_view",
  "dinner_plan_form_start",
  "dinner_plan_form_submit",
  "dinner_plan_confirmed",
  "dinner_plan_download",
  "affiliate_click",
  "affiliate_impression",
  "commerce_click",
  "session_start",
  "page_view",
  "engaged_visit",
  "scroll_depth",
  "recipe_save",
  "recipe_unsave",
  "recipe_share",
  "recipe_print",
  "site_search",
  "internal_cta_click",
  "planner_start",
  "preferences_complete",
  "plan_created",
  "plan_saved",
  "cook_started",
  "cook_completed",
  "shopping_exported",
  "contact_submit",
]);

const BOT_PATTERN = /bot|crawler|spider|preview|facebookexternalhit|pinterest|slurp|headless/i;

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

function canonicalHost(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) {
    return NextResponse.json({ ok: true, ignored: "automated" }, { status: 202 });
  }

  const origin = request.headers.get("origin");
  const expectedHost = canonicalHost(
    new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.vegan-masala.com").host,
  );
  if (origin) {
    try {
      if (
        canonicalHost(new URL(origin).host) !== expectedHost &&
        process.env.NODE_ENV === "production"
      ) {
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

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
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const visitorHash = crypto.createHash("sha256").update(`${forwarded}:${userAgent.slice(0, 120)}`).digest("hex").slice(0, 20);
    const rateKey = `engagement:rate:${visitorHash}`;
    const requestCount = await redis.incr(rateKey);
    if (requestCount === 1) await redis.expire(rateKey, 60);
    if (requestCount > 120) return NextResponse.json({ ok: true, ignored: "rate" }, { status: 202 });

    const eventId = clean(payload.eventId, "none");
    if (eventId !== "none") {
      const accepted = await redis.set(`engagement:event:${eventId}`, "1", { nx: true, ex: 60 * 60 * 24 });
      if (!accepted) return NextResponse.json({ ok: true, ignored: "duplicate" }, { status: 202 });
    }
    const dimensions = [
      event,
      clean(payload.pagePath, "unknown"),
      clean(payload.source, "none"),
      clean(payload.medium, "none"),
      clean(payload.campaign, "none"),
      clean(payload.placement, "none"),
      clean(payload.category, "none"),
      clean(payload.product, "none"),
      clean(payload.landingPage, "unknown"),
      clean(payload.device, "unknown"),
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
