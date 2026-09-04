import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const AMAZON_REPORT_KEY = "growth:amazon-associates:latest";

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function numeric(value: string | undefined) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function findColumn(headers: string[], aliases: string[]) {
  const wanted = aliases.map(normalise);
  return headers.findIndex((header) => wanted.includes(normalise(header)));
}

function currencyFrom(rows: string[][]) {
  const joined = rows.flat().join(" ");
  if (joined.includes("£")) return "GBP";
  if (joined.includes("€")) return "EUR";
  return "USD";
}

export async function POST(request: Request) {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) {
    return NextResponse.json({ ok: false, error: "Dashboard storage is not configured" }, { status: 500 });
  }

  const form = await request.formData();
  const file = form.get("report");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ ok: false, error: "Choose an Amazon CSV report" }, { status: 400 });
  }
  if (file.size > 2_000_000) {
    return NextResponse.json({ ok: false, error: "The report must be smaller than 2 MB" }, { status: 400 });
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return NextResponse.json({ ok: false, error: "The CSV report contains no data rows" }, { status: 400 });
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const orderedIndex = findColumn(headers, ["Items Ordered", "Ordered Items", "Orders"]);
  const shippedIndex = findColumn(headers, ["Items Shipped", "Shipped Items"]);
  const revenueIndex = findColumn(headers, ["Revenue", "Sales", "Ordered Revenue", "Shipped Revenue"]);
  const earningsIndex = findColumn(headers, ["Advertising Fees", "Ad Fees", "Earnings", "Commission", "Commission Income"]);

  if ([orderedIndex, shippedIndex, revenueIndex, earningsIndex].every((index) => index < 0)) {
    return NextResponse.json({
      ok: false,
      error: "This does not look like an Amazon Associates earnings or orders CSV",
    }, { status: 400 });
  }

  const sum = (index: number) => index < 0 ? 0 : dataRows.reduce((total, current) => total + numeric(current[index]), 0);
  const report = {
    importedAt: new Date().toISOString(),
    filename: file.name.slice(0, 160),
    rows: dataRows.length,
    orderedItems: sum(orderedIndex),
    shippedItems: sum(shippedIndex),
    revenue: sum(revenueIndex),
    earnings: sum(earningsIndex),
    currency: currencyFrom(dataRows),
  };

  await new Redis({ url, token }).set(AMAZON_REPORT_KEY, report);
  return NextResponse.json({ ok: true, report });
}
