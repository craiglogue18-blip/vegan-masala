import fs from "node:fs";
import { NextResponse } from "next/server";

import { localJobDirectory } from "@/lib/social/video/renderLocalFootage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json({ ok: false, error: "Local jobs do not exist in production." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { jobId?: string };
    const jobId = String(body.jobId || "").trim();
    if (!jobId) return NextResponse.json({ ok: true, removed: false });
    const directory = localJobDirectory(jobId);
    if (fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
    return NextResponse.json({ ok: true, removed: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Local job cleanup failed." },
      { status: 500 },
    );
  }
}
