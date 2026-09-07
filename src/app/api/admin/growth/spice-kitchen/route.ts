import { NextResponse } from "next/server";
import { getSpiceKitchenAffiliateSummary } from "@/lib/growth-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...(await getSpiceKitchenAffiliateSummary()),
  });
}
