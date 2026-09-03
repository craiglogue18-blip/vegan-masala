import { NextResponse } from "next/server";

import { planWeeklySocialPosts } from "@/lib/social/core/weeklyPlanner";

export const maxDuration = 300;

function hasCronAuthorization(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && req.headers.get("authorization") === `Bearer ${secret}`);
}

function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(req.url);
    if (originUrl.origin === requestUrl.origin) return true;

    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || requestUrl.protocol.slice(0, -1);
    return originUrl.host === forwardedHost && originUrl.protocol === `${forwardedProto}:`;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!hasCronAuthorization(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized weekly planner" }, { status: 401 });
  }

  try {
    const result = await planWeeklySocialPosts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Weekly social planning failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!hasCronAuthorization(req) && !isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized weekly planner" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await planWeeklySocialPosts({
      dryRun: body?.dryRun === true,
      pinterestBoardId:
        typeof body?.pinterestBoardId === "string" ? body.pinterestBoardId.trim() : undefined,
      pinterestRecipeBoardId:
        typeof body?.pinterestRecipeBoardId === "string"
          ? body.pinterestRecipeBoardId.trim()
          : undefined,
      pinterestGuideBoardId:
        typeof body?.pinterestGuideBoardId === "string"
          ? body.pinterestGuideBoardId.trim()
          : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Weekly social planning failed" },
      { status: 500 }
    );
  }
}
