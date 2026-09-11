import { NextResponse } from "next/server";

import { runNewsletterAutomation } from "@/lib/newsletter-automation";

export const maxDuration = 120;

function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ ok: false, error: "Unauthorized cron request" }, { status: 401 });
  try {
    return NextResponse.json(await runNewsletterAutomation());
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Scheduled newsletter failed" }, { status: 500 });
  }
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
