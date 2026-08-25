import { NextResponse } from "next/server";

import { findQueueItemById } from "@/lib/social/core/queue";

const ALLOWED_VIDEO_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await findQueueItemById(id);
  if (!item || item.platform !== "tiktok" || !item.videoUrl) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const source = new URL(item.videoUrl);
  if (source.protocol !== "https:" || !source.hostname.endsWith(ALLOWED_VIDEO_HOST_SUFFIX)) {
    return NextResponse.json({ error: "Video source is not allowed" }, { status: 400 });
  }

  const range = req.headers.get("range");
  const response = await fetch(source, {
    cache: "no-store",
    headers: range ? { Range: range } : undefined,
  });
  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Video unavailable" }, { status: response.status || 502 });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "public, max-age=300");

  return new NextResponse(response.body, { status: response.status, headers });
}
