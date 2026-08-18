import { NextResponse } from "next/server";

import { POST as processQueue } from "../run-now/route";

export const maxDuration = 300;

function isAuthorizedCron(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  return processQueue(req);
}

export async function POST(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized queue runner" }, { status: 401 });
  }

  return processQueue(req);
}
