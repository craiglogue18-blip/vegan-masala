import fs from "node:fs";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { resolveLocalRender } from "@/lib/social/video/renderLocalFootage";

export const runtime = "nodejs";
export const maxDuration = 300;

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.PUBLIC_VIDEO_BLOB_READ_WRITE_TOKEN || "";
}

export async function POST(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json({ ok: false, error: "The local upload bridge cannot run on Vercel." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { jobId?: string; fileName?: string; slug?: string; output?: string; approved?: boolean };
    if (body.approved !== true) {
      return NextResponse.json({ ok: false, error: "Approval is required before upload." }, { status: 400 });
    }
    const token = blobToken();
    if (!token) {
      return NextResponse.json({ ok: false, error: "Production video storage is not connected locally." }, { status: 500 });
    }
    const target = resolveLocalRender(body.jobId || "", body.fileName || "");
    if (!fs.existsSync(target)) {
      return NextResponse.json({ ok: false, error: "The approved local render could not be found." }, { status: 404 });
    }

    const slug = String(body.slug || "video").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    const output = String(body.output || "social").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    const pathname = `videos/raw-footage/${slug}-${output}-${Date.now()}.mp4`;
    const blob = await put(pathname, fs.readFileSync(target), {
      access: "public",
      addRandomSuffix: false,
      contentType: "video/mp4",
      token,
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      message: "Approved render uploaded to production storage. It has not been posted or queued.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Approved render upload failed." },
      { status: 500 },
    );
  }
}
