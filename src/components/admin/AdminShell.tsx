"use client";

import {
  Activity,
  BarChart3,
  ChevronRight,
  Clapperboard,
  Eye,
  EyeOff,
  Gauge,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  Upload,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  isAnalyticsExcluded,
  setAnalyticsExcluded,
} from "@/lib/dinner-plan-tracking";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  localOnly?: boolean;
  tabs?: WorkspaceTab[];
  aliases?: string[];
};

type WorkspaceTab = Omit<NavItem, "icon" | "tabs"> & { shortLabel?: string };

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin/social",
        label: "Dashboard",
        description: "Queue, connections and priorities",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/admin/growth",
        label: "Growth",
        description: "Traffic, audience and revenue",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Create",
    items: [
      {
        href: "/admin/import",
        label: "Recipe studio",
        description: "Import, improve and publish recipes",
        icon: Upload,
        localOnly: true,
        aliases: ["/admin/pipeline"],
      },
      {
        href: "/admin/social/generate",
        label: "Content studio",
        description: "Create posts, campaigns and generated media",
        icon: WandSparkles,
        tabs: [
          { href: "/admin/social/generate", label: "Image posts", description: "Create branded posts and captions", exact: true },
          { href: "/admin/social/campaigns", label: "Campaigns", description: "Stories, carousels and affiliate campaigns" },
          { href: "/admin/social/video", label: "Generated video", description: "Create short-form generated videos" },
        ],
      },
      {
        href: "/admin/newsletters",
        label: "Newsletter studio",
        description: "Create and schedule Kit emails",
        icon: Mail,
      },
    ],
  },
  {
    label: "Video",
    items: [
      {
        href: "/admin/social/production",
        label: "Video studio",
        description: "Plan, build and repurpose recipe videos",
        icon: Clapperboard,
        exact: true,
        localOnly: true,
        tabs: [
          { href: "/admin/social/production", label: "Build video", description: "Turn raw cooking footage into a complete edit", exact: true, localOnly: true },
          { href: "/admin/social/production/filming-pack", label: "Plan shoot", description: "Shot lists and printable filming plans", localOnly: true },
          { href: "/admin/social/launch-pack", label: "Repurpose", description: "Prepare a completed video for every platform", localOnly: true },
        ],
      },
    ],
  },
  {
    label: "Publish",
    items: [
      {
        href: "/admin/social/queue",
        label: "Publishing",
        description: "Plan, approve and distribute content",
        icon: Activity,
        tabs: [
          { href: "/admin/social/queue", label: "Queue and calendar", description: "Review, approve and schedule posts", exact: true },
          { href: "/admin/social/automation", label: "Planner", description: "Recurring and campaign workflows" },
        ],
      },
      {
        href: "/admin/social/inbox",
        label: "Social inbox",
        description: "Comments and conversations",
        icon: Inbox,
      },
    ],
  },
  {
    label: "Quality",
    items: [
      {
        href: "/admin/health",
        label: "Site health",
        description: "Publishing, SEO and recipe quality",
        icon: HeartPulse,
        tabs: [
          { href: "/admin/health", label: "Overview", description: "Triage publishing, SEO and recipe issues", exact: true },
          { href: "/admin/social/health", label: "Publishing", description: "Connections and publishing failures", exact: true },
          { href: "/admin/seo/health", label: "SEO", description: "Search structure and coverage" },
          { href: "/admin/publisher", label: "Recipe Publisher", description: "Upload videos and publish recipe changes" },
          { href: "/admin/app/health", label: "Recipes", description: "Planner, serving and video data" },
        ],
      },
    ],
  },
];

const allItems = navGroups.flatMap((group) => group.items);

function itemIsActive(pathname: string, item: NavItem) {
  if (item.tabs?.some((tab) => tabIsActive(pathname, tab))) return true;
  if (item.aliases?.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`))) return true;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function tabIsActive(pathname: string, tab: WorkspaceTab) {
  if (tab.exact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

function destinationHref(item: Pick<NavItem, "href" | "localOnly">, localHost: boolean) {
  if (item.localOnly) return `http://127.0.0.1:3010${item.href}`;
  if (localHost) return `https://www.vegan-masala.com${item.href}`;
  return item.href;
}

function SidebarContent({
  pathname,
  onNavigate,
  localHost,
  serviceState,
  badges,
  analyticsExcluded,
  onToggleAnalytics,
}: {
  pathname: string;
  onNavigate: () => void;
  localHost: boolean;
  serviceState: "checking" | "ready" | "attention";
  badges: Record<string, number>;
  analyticsExcluded: boolean;
  onToggleAnalytics: () => void;
}) {
  const dashboardHref = localHost
    ? "https://www.vegan-masala.com/admin/social"
    : "/admin/social";

  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <Link href={dashboardHref} onClick={onNavigate} className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#d6b25e]/35 bg-black/30">
            <Image src="/brand/logo-mark.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" priority />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold leading-none text-[#e7c86e]">Vegan Masala</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Admin workspace</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin utilities">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = itemIsActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={destinationHref(item, localHost)}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      active
                        ? "border-[#d6b25e]/35 bg-[#d6b25e]/12 text-[#f1d67e] shadow-[inset_3px_0_0_#d6b25e]"
                        : "border-transparent text-white/68 hover:border-white/8 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon aria-hidden="true" size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold leading-4">{item.label}</span>
                      <span className={`mt-0.5 block truncate text-[11px] ${active ? "text-[#f1d67e]/65" : "text-white/35"}`}>
                        {item.description}
                      </span>
                    </span>
                    {item.localOnly ? <span className="shrink-0 rounded bg-white/7 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/35">Mac</span> : null}
                    {badges[item.href] ? <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-200">{badges[item.href]}</span> : null}
                    <ChevronRight aria-hidden="true" size={14} className={active ? "opacity-80" : "opacity-0 transition group-hover:opacity-50"} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={onToggleAnalytics}
          aria-pressed={analyticsExcluded}
          className={`mb-3 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
            analyticsExcluded
              ? "border-[#d6b25e]/30 bg-[#d6b25e]/10 text-[#f1d67e]"
              : "border-white/10 bg-white/[0.025] text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          {analyticsExcluded ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="min-w-0">
            <span className="block text-[11px] font-bold">
              {localHost
                ? "Set exclusion on live site"
                : analyticsExcluded
                  ? "This browser is excluded"
                  : "Exclude this browser"}
            </span>
            <span className="block text-[9px] leading-4 opacity-55">
              {localHost
                ? "Opens the production admin securely"
                : analyticsExcluded
                  ? "Admin and test visits are ignored"
                  : "Keep testing out of growth reports"}
            </span>
          </span>
        </button>
        <div className={`flex items-center gap-2 text-xs font-bold ${serviceState === "ready" ? "text-emerald-300/80" : serviceState === "attention" ? "text-amber-300/80" : "text-white/45"}`}>
          <span className={`h-2 w-2 rounded-full ${serviceState === "ready" ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.75)]" : serviceState === "attention" ? "bg-amber-400" : "animate-pulse bg-white/35"}`} />
          {serviceState === "ready" ? `${localHost ? "Local" : "Live"} admin API responding` : serviceState === "attention" ? "Admin API needs attention" : "Checking admin API"}
        </div>
        <p className="mt-1 text-[10px] leading-4 text-white/30">{localHost ? "Mac-only processing workspace" : "Private live workspace · not indexed"}</p>
      </div>
    </>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localHost, setLocalHost] = useState(false);
  const [serviceState, setServiceState] = useState<"checking" | "ready" | "attention">("checking");
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [analyticsExcluded, setAnalyticsExcludedState] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const params = new URLSearchParams(window.location.search);
    const requestedExclusion = params.get("analytics_exclude");
    let excluded = isAnalyticsExcluded();
    if (requestedExclusion === "1" || requestedExclusion === "0") {
      excluded = requestedExclusion === "1";
      setAnalyticsExcluded(excluded);
      params.delete("analytics_exclude");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
    const timer = window.setTimeout(() => {
      setLocalHost(isLocal);
      setAnalyticsExcludedState(excluded);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleAnalytics = () => {
    if (localHost) {
      window.location.assign("https://www.vegan-masala.com/admin/growth?analytics_exclude=1");
      return;
    }
    const next = !analyticsExcluded;
    setAnalyticsExcluded(next);
    setAnalyticsExcludedState(next);
  };
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/social/platform-health", { cache: "no-store" }),
      fetch("/api/admin/social/queue", { cache: "no-store" }),
    ])
      .then(async ([healthResponse, queueResponse]) => ({
        healthResponse,
        health: await healthResponse.json().catch(() => ({})),
        queue: await queueResponse.json().catch(() => ({})),
      }))
      .then(({ healthResponse, health, queue }) => {
        if (cancelled) return;
        setServiceState(healthResponse.ok && health?.ok ? "ready" : "attention");
        const items = Array.isArray(queue?.items) ? queue.items : [];
        const attention = items.filter((item: { status?: string; requiresApproval?: boolean }) => item.status === "failed" || (item.status === "queued" && item.requiresApproval)).length;
        const failed = items.filter((item: { status?: string }) => item.status === "failed").length;
        setBadges({ "/admin/social/queue": attention, "/admin/health": failed });
      })
      .catch(() => {
        if (!cancelled) setServiceState("attention");
      });
    return () => { cancelled = true; };
  }, [pathname]);

  const current = useMemo(
    () => [...allItems].sort((a, b) => b.href.length - a.href.length).find((item) => itemIsActive(pathname, item)),
    [pathname]
  );
  useEffect(() => {
    if (!current || pathname === "/admin/social" || pathname === "/admin/growth" || pathname.includes("/health") || pathname.endsWith("/inbox")) return;
    const activeTab = current.tabs?.find((tab) => tabIsActive(pathname, tab));
    window.localStorage.setItem("vegan-masala-admin-last-work", JSON.stringify({
      href: `${window.location.origin}${pathname}`,
      label: activeTab?.label || current.label,
      workspace: current.label,
      savedAt: new Date().toISOString(),
    }));
  }, [current, pathname]);

  return (
    <div className="admin-app min-h-screen bg-[#071116] text-[#f6f2e6]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[286px] flex-col border-r border-white/10 bg-[#0a151b] shadow-2xl shadow-black/30 lg:flex">
        <SidebarContent pathname={pathname} onNavigate={() => undefined} localHost={localHost} serviceState={serviceState} badges={badges} analyticsExcluded={analyticsExcluded} onToggleAnalytics={toggleAnalytics} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(88vw,320px)] flex-col border-r border-white/10 bg-[#0a151b] shadow-2xl">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 rounded-xl border border-white/10 bg-black/30 p-2 text-white/65" aria-label="Close menu">
              <X size={19} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} localHost={localHost} serviceState={serviceState} badges={badges} analyticsExcluded={analyticsExcluded} onToggleAnalytics={toggleAnalytics} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-[286px]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071116]/92 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/75 lg:hidden" aria-label="Open admin navigation">
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-extrabold text-white">{current?.label || "Admin workspace"}</div>
              <div className="truncate text-[11px] text-white/40">{current?.description || "Vegan Masala operations"}</div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-bold text-white/45 sm:flex">
              <Gauge size={14} className="text-[#d6b25e]" />
              {localHost ? "Runs on this Mac" : "Live workspace"}
            </div>
          </div>
          {current?.tabs?.length ? (
            <nav className="flex min-w-0 gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-2 sm:px-6 lg:px-8" aria-label={`${current.label} tools`}>
              {current.tabs.map((tab) => {
                const active = tabIsActive(pathname, tab);
                return (
                  <Link key={tab.href} href={destinationHref(tab, localHost)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${active ? "bg-[#d6b25e]/15 text-[#f1d67e]" : "text-white/45 hover:bg-white/5 hover:text-white/75"}`}>
                    {tab.label}{tab.localOnly ? <span className="ml-2 rounded bg-white/7 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/35">Mac</span> : null}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </header>

        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
