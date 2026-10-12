"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueueItem = {
  id: string;
  title?: string;
  slug: string;
  platform: string;
  scheduledFor: string;
  status: "queued" | "posted" | "failed";
  requiresApproval?: boolean;
};

type PlatformHealth = {
  youtube?: { configured: boolean; privacyStatus: string };
  tiktok?: { configured: boolean; directPostEnabled: boolean; privacyLevel: string };
  automation?: { cronSecretConfigured: boolean; persistentQueueConfigured: boolean };
};

type MetaHealth = {
  instagramConfigured?: boolean;
  facebookConfigured?: boolean;
};

type SpiceKitchenSummary = {
  clicks: number;
  previousClicks: number;
  livePlacements: number;
  trackingConnected: boolean;
};

type ResumeWork = {
  href: string;
  label: string;
  workspace: string;
  savedAt: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth>({});
  const [metaHealth, setMetaHealth] = useState<MetaHealth>({});
  const [pinterestConnected, setPinterestConnected] = useState<boolean | null>(null);
  const [spiceKitchen, setSpiceKitchen] = useState<SpiceKitchenSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resumeWork, setResumeWork] = useState<ResumeWork | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, platformRes, metaRes, pinterestRes, spiceKitchenRes] = await Promise.all([
        fetch("/api/admin/social/queue", { cache: "no-store" }),
        fetch("/api/admin/social/platform-health", { cache: "no-store" }),
        fetch("/api/admin/social/meta-health", { cache: "no-store" }),
        fetch("/api/pinterest/boards", { cache: "no-store" }),
        fetch("/api/admin/growth/spice-kitchen", { cache: "no-store" }),
      ]);
      const [queueData, platformData, metaData, pinterestData, spiceKitchenData] = await Promise.all([
        queueRes.json().catch(() => ({})),
        platformRes.json().catch(() => ({})),
        metaRes.json().catch(() => ({})),
        pinterestRes.json().catch(() => ({})),
        spiceKitchenRes.json().catch(() => ({})),
      ]);
      setQueueItems(Array.isArray(queueData?.items) ? queueData.items : []);
      setPlatformHealth(platformData?.ok ? platformData : {});
      setMetaHealth(metaData || {});
      setPinterestConnected(Boolean(pinterestData?.ok));
      setSpiceKitchen(spiceKitchenData?.ok ? spiceKitchenData : null);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    try {
      const saved = window.localStorage.getItem("vegan-masala-admin-last-work");
      if (saved) setResumeWork(JSON.parse(saved) as ResumeWork);
    } catch {
      setResumeWork(null);
    }
  }, [loadStatus]);

  const queued = useMemo(() => queueItems.filter((item) => item.status === "queued"), [queueItems]);
  const awaitingApproval = useMemo(() => queued.filter((item) => item.requiresApproval), [queued]);
  const approved = useMemo(() => queued.filter((item) => !item.requiresApproval), [queued]);
  const failed = useMemo(() => queueItems.filter((item) => item.status === "failed"), [queueItems]);
  const upcoming = useMemo(
    () => [...approved].filter((item) => new Date(item.scheduledFor).getTime() > Date.now()).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)).slice(0, 5),
    [approved]
  );

  const connections = useMemo(
    () => [
      { label: "Instagram", ready: typeof metaHealth.instagramConfigured === "boolean" ? metaHealth.instagramConfigured : null },
      { label: "Facebook", ready: typeof metaHealth.facebookConfigured === "boolean" ? metaHealth.facebookConfigured : null },
      { label: "Pinterest", ready: pinterestConnected },
      { label: "YouTube", ready: typeof platformHealth.youtube?.configured === "boolean" ? platformHealth.youtube.configured : null },
      { label: "TikTok", ready: typeof platformHealth.tiktok?.configured === "boolean" ? platformHealth.tiktok.configured : null },
      {
        label: "Queue scheduler",
        ready: platformHealth.automation
          ? platformHealth.automation.cronSecretConfigured && platformHealth.automation.persistentQueueConfigured
          : null,
      },
    ],
    [metaHealth, pinterestConnected, platformHealth]
  );
  const connectionWarnings = connections.filter((item) => item.ready === false);
  const recommendedActions = useMemo(() => {
    const actions = [];
    if (resumeWork) actions.push({ href: resumeWork.href, label: `Resume ${resumeWork.label.toLowerCase()}`, description: `Continue in ${resumeWork.workspace} from your previous admin session.`, icon: ArrowRight, tone: "text-[var(--brand-gold)]" });
    if (failed.length) actions.push({ href: "/admin/social/queue", label: `Resolve ${failed.length} publishing failure${failed.length === 1 ? "" : "s"}`, description: "Review the error, repair the connection and retry.", icon: AlertTriangle, tone: "text-red-300" });
    if (awaitingApproval.length) actions.push({ href: "/admin/social/queue", label: `Approve ${awaitingApproval.length} held draft${awaitingApproval.length === 1 ? "" : "s"}`, description: "Nothing held for review will publish until it is approved.", icon: CalendarClock, tone: "text-amber-300" });
    if (connectionWarnings.length) actions.push({ href: "/admin/health", label: `Repair ${connectionWarnings.length} connection${connectionWarnings.length === 1 ? "" : "s"}`, description: "Restore publishing or reporting access before the next scheduled run.", icon: HeartPulse, tone: "text-amber-300" });
    if (!upcoming.length) actions.push({ href: "/admin/social/generate", label: "Prepare the next piece of content", description: "The approved queue has no upcoming posts.", icon: Sparkles, tone: "text-[var(--brand-gold)]" });
    if (!actions.length) actions.push({ href: "/admin/growth", label: "Review the strongest growth opportunity", description: "Publishing is healthy; use current performance to choose the next topic.", icon: TrendingUp, tone: "text-emerald-300" });
    return actions.slice(0, 4);
  }, [awaitingApproval.length, connectionWarnings.length, failed.length, resumeWork, upcoming.length]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="flex flex-col gap-5 border-b border-white/10 pb-7 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]/65">Control centre</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Welcome back, Craig</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            Your publishing, growth and content tools now live in one persistent workspace. Use the navigation on the left to move between utilities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="hidden text-xs text-white/35 sm:block">Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button type="button" onClick={() => void loadStatus()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Approved and queued", value: approved.length, note: "Ready for scheduled publishing", icon: Send, tone: "text-emerald-300" },
          { label: "Waiting for review", value: awaitingApproval.length, note: "Held until you approve", icon: CalendarClock, tone: "text-amber-300" },
          { label: "Publishing failures", value: failed.length, note: failed.length ? "Needs attention" : "Nothing needs attention", icon: AlertTriangle, tone: failed.length ? "text-red-300" : "text-emerald-300" },
          { label: "Affiliate clicks", value: spiceKitchen?.clicks ?? "—", note: "Latest 28 days", icon: TrendingUp, tone: "text-[var(--brand-gold)]" },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/42">{metric.label}</span>
                <Icon size={18} className={metric.tone} />
              </div>
              <div className={`mt-4 text-4xl font-extrabold ${metric.tone}`}>{loading ? "·" : metric.value}</div>
              <div className="mt-1 text-xs text-white/38">{metric.note}</div>
            </div>
          );
        })}
      </section>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)]">
        <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-extrabold text-white">Next scheduled posts</h2>
              <p className="mt-0.5 text-xs text-white/38">The next approved items in the live publishing queue.</p>
            </div>
            <Link href="/admin/social/queue" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[var(--brand-gold)] hover:text-[#f1d67e]">
              Open queue <ArrowRight size={15} />
            </Link>
          </div>
          <div className="divide-y divide-white/8">
            {loading ? (
              <div className="px-6 py-12 text-center text-sm text-white/35">Loading the queue…</div>
            ) : upcoming.length ? (
              upcoming.map((item) => (
                <div key={item.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white/85">{item.title || item.slug}</div>
                    <div className="mt-1 text-xs capitalize text-white/38">{item.platform}</div>
                  </div>
                  <div className="text-sm font-bold text-[var(--brand-gold)]/80">{formatDate(item.scheduledFor)}</div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <CalendarClock className="mx-auto text-white/20" />
                <div className="mt-3 font-bold text-white/60">Nothing scheduled</div>
                <Link href="/admin/social/generate" className="mt-2 inline-flex text-sm font-bold text-[var(--brand-gold)]">Create the next post</Link>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-extrabold text-white">System readiness</h2>
            <p className="mt-0.5 text-xs text-white/38">Publishing connections and automation.</p>
          </div>
          <div className="space-y-1 p-4">
            {connections.map((connection) => (
              <div key={connection.label} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white/[0.035]">
                <span className="text-sm font-bold text-white/65">{connection.label}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${connection.ready === true ? "text-emerald-300" : connection.ready === false ? "text-amber-300" : "text-white/35"}`}>
                  {connection.ready === true ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  {connection.ready === true ? "Ready" : connection.ready === false ? "Check" : "Unknown"}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-4">
            <Link href="/admin/health" className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white/65 hover:bg-white/10 hover:text-white">
              <span className="inline-flex items-center gap-2"><HeartPulse size={17} className="text-[var(--brand-gold)]" /> Full health report</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white">Recommended next actions</h2>
            <p className="mt-1 text-xs text-white/38">Prioritised from the live queue and connection checks.</p>
          </div>
          {connectionWarnings.length > 0 && <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">{connectionWarnings.length} connection warning{connectionWarnings.length === 1 ? "" : "s"}</span>}
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {recommendedActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/8 bg-black/15 p-4 transition hover:border-[var(--brand-gold)]/30 hover:bg-[var(--brand-gold)]/[0.06]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]"><Icon size={19} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-white/80 group-hover:text-white">{action.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-white/35">{action.description}</span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-gold)]" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
