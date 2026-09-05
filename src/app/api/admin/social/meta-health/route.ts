import { NextResponse } from "next/server";
import {
  getMetaAuthDiagnostics,
  getMetaConfig,
  validateMetaConfig,
} from "@/lib/social/publishers/metaCore";

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

type MetaPermission = {
  permission?: unknown;
  status?: unknown;
};

async function readLiveMetaPermissions(accessToken: string, pageId: string) {
  if (!accessToken) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const permissionUrl = new URL(`${GRAPH_BASE}/me/permissions`);
    permissionUrl.searchParams.set("access_token", accessToken);

    const pageUrl = new URL(`${GRAPH_BASE}/${pageId}`);
    pageUrl.searchParams.set("fields", "id,name,tasks");
    pageUrl.searchParams.set("access_token", accessToken);

    const [permissionResponse, pageResponse] = await Promise.all([
      fetch(permissionUrl, { cache: "no-store", signal: controller.signal }),
      pageId
        ? fetch(pageUrl, { cache: "no-store", signal: controller.signal })
        : Promise.resolve(null),
    ]);

    const permissionBody = await permissionResponse.json().catch(() => ({}));
    const pageBody = pageResponse
      ? await pageResponse.json().catch(() => ({}))
      : null;

    return {
      tokenAccepted: permissionResponse.ok,
      grantedPermissions: Array.isArray(permissionBody?.data)
        ? permissionBody.data
            .filter((item: MetaPermission) => item?.status === "granted")
            .map((item: MetaPermission) => String(item.permission))
            .sort()
        : [],
      permissionsError: permissionResponse.ok
        ? null
        : permissionBody?.error?.message || `Meta returned ${permissionResponse.status}`,
      pageAccepted: pageResponse?.ok ?? false,
      page: pageResponse?.ok
        ? {
            id: String(pageBody?.id || ""),
            name: String(pageBody?.name || ""),
            tasks: Array.isArray(pageBody?.tasks) ? pageBody.tasks.map(String).sort() : [],
          }
        : null,
      pageError:
        pageResponse && !pageResponse.ok
          ? pageBody?.error?.message || `Meta returned ${pageResponse.status}`
          : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    const config = getMetaConfig();
    const diagnostics = getMetaAuthDiagnostics(config);

    const instagram = validateMetaConfig("instagram", config);
    const facebook = validateMetaConfig("facebook", config);

    const missing = [...new Set([...instagram.missing, ...facebook.missing])];
    const warnings = [...new Set([...instagram.warnings, ...facebook.warnings, ...diagnostics.warnings])];
    const livePermissions = await readLiveMetaPermissions(
      config.pageAccessToken || config.accessToken,
      config.pageId
    );

    return NextResponse.json({
      instagramConfigured: instagram.ok,
      facebookConfigured: facebook.ok,
      missing,
      warnings,
      diagnostics: {
        present: diagnostics.present,
        tokenInfo: diagnostics.tokenInfo,
        livePermissions,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        instagramConfigured: false,
        facebookConfigured: false,
        missing: [],
        warnings: [],
        error: err instanceof Error ? err.message : "Meta configuration check failed",
      },
      { status: 500 }
    );
  }
}
