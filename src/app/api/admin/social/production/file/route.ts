import fs from "node:fs";
import { NextResponse } from "next/server";

import { resolveLocalRender } from "@/lib/social/video/renderLocalFootage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json({ ok: false, error: "Local renders are not stored in production." }, { status: 404 });
  }

  try {
    const url = new URL(request.url);
    const target = resolveLocalRender(url.searchParams.get("job") || "", url.searchParams.get("name") || "");
    if (!fs.existsSync(target)) {
      return NextResponse.json({ ok: false, error: "Local render not found." }, { status: 404 });
    }
    const data = fs.readFileSync(target);
    return new Response(data, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(data.byteLength),
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${target.split("/").pop()}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to open local render." },
      { status: 400 },
    );
  }
}
