import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filename = "vegan-masala-first-10-filming-pack.pdf";

export async function GET() {
  if (process.env.VERCEL) {
    return Response.json(
      { error: "The filming pack PDF is available from the local production studio." },
      { status: 403 },
    );
  }

  try {
    const filePath = path.join(process.cwd(), "output", "pdf", filename);
    const pdf = await readFile(filePath);

    return new Response(pdf, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.byteLength),
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return Response.json(
      { error: "The filming pack PDF has not been generated yet." },
      { status: 404 },
    );
  }
}
