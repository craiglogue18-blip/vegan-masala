import { NextResponse, type NextRequest } from "next/server";

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

function hasValidAdminCredentials(request: NextRequest) {
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim() || process.env.ADMIN_TOKEN?.trim();
  const expectedUsername = process.env.ADMIN_USERNAME?.trim() || "vegan-masala";

  if (!expectedPassword) return false;

  const headerToken = request.headers.get("x-admin-token")?.trim();
  if (headerToken && safeEqual(headerToken, expectedPassword)) return true;

  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Basic ")) return false;

  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    if (separator === -1) return false;

    return (
      safeEqual(decoded.slice(0, separator), expectedUsername) &&
      safeEqual(decoded.slice(separator + 1), expectedPassword)
    );
  } catch {
    return false;
  }
}

function hasValidCronCredentials(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  return Boolean(
    cronSecret && safeEqual(request.headers.get("authorization") || "", `Bearer ${cronSecret}`)
  );
}

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Generated social artwork must remain fetchable by the publishing platforms.
  if (pathname.startsWith("/api/admin/social/instagram-image/")) {
    return NextResponse.next();
  }

  if (hasValidAdminCredentials(request) || hasValidCronCredentials(request)) {
    return NextResponse.next();
  }

  return new NextResponse("Administrator authentication required.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Basic realm="Vegan Masala administration", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/pinterest/connect",
    "/api/tiktok/connect",
    "/api/youtube/connect",
  ],
};
