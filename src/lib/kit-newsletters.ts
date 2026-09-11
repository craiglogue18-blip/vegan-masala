import "server-only";

import { renderNewsletterHtml, type NewsletterDraft } from "@/lib/newsletters";

const KIT_BASE = "https://api.kit.com/v4";

export type KitTemplate = { id: number; name?: string; is_default?: boolean; category?: string };

function apiKey() {
  const key = process.env.KIT_API_KEY?.trim();
  if (!key) throw new Error("KIT_API_KEY is not configured");
  return key;
}

export async function kitRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${KIT_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey(),
      ...(init?.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = Array.isArray(payload?.errors)
      ? payload.errors.join(". ")
      : `Kit request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export async function getKitOverview() {
  if (!process.env.KIT_API_KEY?.trim()) {
    return { configured: false, subscribers: null, templates: [], broadcasts: [], error: null };
  }
  try {
    const [subscriberData, templateData, broadcastData] = await Promise.all([
      kitRequest("/subscribers?include_total_count=true&per_page=1&slim=true&status=active"),
      kitRequest("/email_templates?per_page=100"),
      kitRequest("/broadcasts?per_page=12"),
    ]);
    return {
      configured: true,
      subscribers: Number(subscriberData?.total_count ?? subscriberData?.pagination?.total_count ?? 0),
      templates: Array.isArray(templateData?.email_templates)
        ? (templateData.email_templates as KitTemplate[]).filter((template) => template?.category !== "Starting point")
        : [],
      broadcasts: Array.isArray(broadcastData?.broadcasts) ? broadcastData.broadcasts : [],
      error: null,
    };
  } catch (error: unknown) {
    return {
      configured: true,
      subscribers: null,
      templates: [],
      broadcasts: [],
      error: error instanceof Error && error.message ? error.message : "Kit is temporarily unavailable",
    };
  }
}

export async function createKitNewsletter(
  newsletter: NewsletterDraft,
  options: { sendAt: string | null; publishToWeb: boolean },
) {
  const overview = await getKitOverview();
  if (!overview.configured || overview.subscribers === null) {
    throw new Error(overview.error || "Kit is not connected");
  }
  const preferredTemplate = overview.templates.find((template: KitTemplate) => template?.name === "Text Only")
    || overview.templates.find((template: KitTemplate) => template?.is_default)
    || overview.templates[0];
  const payload = await kitRequest("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      email_template_id: preferredTemplate?.id,
      email_address: null,
      content: renderNewsletterHtml(newsletter),
      description: `Vegan Masala newsletter · ${newsletter.subject}`,
      public: options.publishToWeb,
      published_at: new Date().toISOString(),
      send_at: options.sendAt,
      thumbnail_alt: null,
      thumbnail_url: null,
      preview_text: newsletter.previewText,
      subject: newsletter.subject,
      subscriber_filter: [{ all: [{ type: "all_subscribers" }] }],
    }),
  });
  return { overview, broadcast: payload?.broadcast || null };
}
