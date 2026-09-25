import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import {
  createLocalJobId,
  localJobDirectory,
  renderLocalFootage,
  type LocalOutputId,
  type LocalSource,
} from "@/lib/social/video/renderLocalFootage";

export const runtime = "nodejs";
export const maxDuration = 300;

type RenderMetadata = {
  slug?: string;
  title?: string;
  template?: string;
  outputs?: LocalOutputId[];
  files?: Array<{ field: string; slot: string; order: number; caption?: string }>;
};

function safeFileName(value: string) {
  const extension = path.extname(value).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8);
  const base = path.basename(value, path.extname(value)).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "source";
  return `${base}${extension}`;
}

export async function POST(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { ok: false, error: "Raw footage rendering is deliberately disabled in production. Run the local studio on your Mac." },
      { status: 403 },
    );
  }

  try {
    const form = await request.formData();
    const rawMetadata = String(form.get("metadata") || "{}");
    const metadata = JSON.parse(rawMetadata) as RenderMetadata;
    const slug = String(metadata.slug || "").trim();
    const title = String(metadata.title || slug).trim();
    const template = String(metadata.template || "complete").trim();
    const outputs = Array.isArray(metadata.outputs) ? metadata.outputs : [];

    if (!slug || !title) {
      return NextResponse.json({ ok: false, error: "Choose a recipe before rendering." }, { status: 400 });
    }

    const jobId = createLocalJobId(slug);
    const sourceDirectory = path.join(localJobDirectory(jobId), "source");
    fs.mkdirSync(sourceDirectory, { recursive: true });
    const sources: LocalSource[] = [];

    for (const descriptor of metadata.files || []) {
      const file = form.get(descriptor.field);
      if (!(file instanceof File)) continue;
      const fileName = `${String(sources.length).padStart(3, "0")}-${safeFileName(file.name)}`;
      const localPath = path.join(sourceDirectory, fileName);
      fs.writeFileSync(localPath, Buffer.from(await file.arrayBuffer()));
      sources.push({
        slot: descriptor.slot,
        order: descriptor.order,
        path: localPath,
        originalName: file.name,
        mime: file.type || "application/octet-stream",
        caption: String(descriptor.caption || title).trim(),
      });
    }

    const results = await renderLocalFootage({ jobId, slug, title, template, outputs, sources });
    return NextResponse.json({
      ok: true,
      jobId,
      results: results.map((result) => ({
        id: result.id,
        label: result.label,
        fileName: result.fileName,
        previewUrl: result.previewUrl,
        width: result.width,
        height: result.height,
      })),
      message: `${results.length} branded video${results.length === 1 ? "" : "s"} rendered locally. Nothing has been uploaded.`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Local render failed." },
      { status: 500 },
    );
  }
}
