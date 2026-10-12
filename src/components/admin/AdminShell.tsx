"use client";

import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Bot,
  ChevronRight,
  Clapperboard,
  FileDown,
  Gauge,
  HeartPulse,
  Images,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  PackageOpen,
  SearchCheck,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  localOnly?: boolean;
};

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
        label: "Recipe importer",
        description: "Bring new recipes into the library",
        icon: Upload,
        localOnly: true,
      },
      {
        href: "/admin/pipeline",
        label: "Recipe pipeline",
        description: "Prepare and publish recipe content",
        icon: PackageOpen,
        localOnly: true,
      },
      {
        href: "/admin/newsletters",
        label: "Newsletter studio",
        description: "Create and schedule Kit emails",
        icon: Mail,
      },
      {
        href: "/admin/social/generate",
        label: "Post generator",
        description: "Build branded social assets",
        icon: WandSparkles,
      },
      {
        href: "/admin/social/campaigns",
        label: "Campaign studio",
        description: "Stories, campaigns and affiliate posts",
        icon: Images,
      },
    ],
  },
  {
    label: "Video",
    items: [
      {
        href: "/admin/social/video",
        label: "Video generator",
        description: "Branded short-form videos",
        icon: Video,
      },
      {
        href: "/admin/social/production",
        label: "Footage studio",
        description: "Turn raw cooking footage into edits",
        icon: Clapperboard,
        exact: true,
        localOnly: true,
      },
      {
        href: "/admin/social/launch-pack",
        label: "Recipe launch pack",
        description: "Prepare every platform format",
        icon: Sparkles,
        localOnly: true,
      },
      {
        href: "/admin/social/production/filming-pack",
        label: "Filming pack",
        description: "Shot lists and printable plans",
        icon: FileDown,
        localOnly: true,
      },
    ],
  },
  {
    label: "Publish",
    items: [
      {
        href: "/admin/social/queue",
        label: "Social queue",
        description: "Review, approve and schedule posts",
        icon: Activity,
      },
      {
        href: "/admin/social/automation",
        label: "Automation",
        description: "Recurring social workflows",
        icon: Bot,
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
        href: "/admin/social/health",
        label: "Platform health",
        description: "Connections and publishing failures",
        icon: HeartPulse,
      },
      {
        href: "/admin/seo/health",
        label: "SEO health",
        description: "Search structure and coverage",
        icon: SearchCheck,
      },
      {
        href: "/admin/app/health",
        label: "Recipe health",
        description: "Planner, serving and video data",
        icon: BookOpenCheck,
      },
    ],
  },
];

const allItems = navGroups.flatMap((group) => group.items);

function itemIsActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarContent({
  pathname,
  onNavigate,
  localHost,
}: {
  pathname: string;
  onNavigate: () => void;
  localHost: boolean;
}) {
  const dashboardHref = localHost
    ? "https://www.vegan-masala.com/admin/social"
    : "/admin/social";

  function navHref(item: NavItem) {
    if (item.localOnly) return `http://127.0.0.1:3010${item.href}`;
    if (localHost) return `https://www.vegan-masala.com${item.href}`;
    return item.href;
  }

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
                    href={navHref(item)}
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
                    <ChevronRight aria-hidden="true" size={14} className={active ? "opacity-80" : "opacity-0 transition group-hover:opacity-50"} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300/80">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.75)]" />
          Admin service ready
        </div>
        <p className="mt-1 text-[10px] leading-4 text-white/30">Private workspace · not indexed</p>
      </div>
    </>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localHost, setLocalHost] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    setLocalHost(window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");
  }, []);

  const current = useMemo(
    () => [...allItems].sort((a, b) => b.href.length - a.href.length).find((item) => itemIsActive(pathname, item)),
    [pathname]
  );

  return (
    <div className="admin-app min-h-screen bg-[#071116] text-[#f6f2e6]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[286px] flex-col border-r border-white/10 bg-[#0a151b] shadow-2xl shadow-black/30 lg:flex">
        <SidebarContent pathname={pathname} onNavigate={() => undefined} localHost={localHost} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(88vw,320px)] flex-col border-r border-white/10 bg-[#0a151b] shadow-2xl">
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 rounded-xl border border-white/10 bg-black/30 p-2 text-white/65" aria-label="Close menu">
              <X size={19} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} localHost={localHost} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-[286px]">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/10 bg-[#071116]/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/75 lg:hidden" aria-label="Open admin navigation">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-white">{current?.label || "Admin workspace"}</div>
            <div className="truncate text-[11px] text-white/40">{current?.description || "Vegan Masala operations"}</div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-bold text-white/45 sm:flex">
            <Gauge size={14} className="text-[#d6b25e]" />
            Workspace
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
