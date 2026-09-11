import { NextResponse } from "next/server";

import { getNewsletterAutomation, saveNewsletterAutomation } from "@/lib/newsletter-automation";

export const dynamic = "force-dynamic";

function message(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Newsletter automation request failed";
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...(await getNewsletterAutomation()) });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.config?.enabled && body?.confirmAutomaticSending !== true) {
      return NextResponse.json({ ok: false, error: "Confirm automatic sending before enabling the schedule" }, { status: 409 });
    }
    const config = await saveNewsletterAutomation(body?.config);
    return NextResponse.json({ ok: true, config });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: message(error) }, { status: 400 });
  }
}
