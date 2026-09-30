// src/lib/admin/guard.ts
import { NextResponse } from "next/server";

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

/**
 * Blocks these admin endpoints on Vercel by default.
 * If you *want* to allow it on Vercel, set ADMIN_TOKEN in Vercel env
 * and pass it from the UI (we do that locally only).
 */
export function guardAdmin(req: Request) {
  const isVercel = !!process.env.VERCEL;

  // Local dev: allow
  if (!isVercel) return null;

  // On Vercel: require token
  const token = process.env.ADMIN_PASSWORD?.trim() || process.env.ADMIN_TOKEN?.trim();
  const header = req.headers.get("x-admin-token")?.trim() || "";
  const expectedUsername = process.env.ADMIN_USERNAME?.trim() || "vegan-masala";

  if (token && header && safeEqual(header, token)) return null;

  const authorization = req.headers.get("authorization") || "";
  if (token && authorization.startsWith("Basic ")) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(":");
      if (
        separator !== -1 &&
        safeEqual(decoded.slice(0, separator), expectedUsername) &&
        safeEqual(decoded.slice(separator + 1), token)
      ) {
        return null;
      }
    } catch {
      // Fall through to the standard forbidden response.
    }
  }

  if (!token || !header || !safeEqual(header, token)) {
    return NextResponse.json(
      { ok: false, error: "Admin endpoints are disabled in production." },
      { status: 403 }
    );
  }

  return null;
}
