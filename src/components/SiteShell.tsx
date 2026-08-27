"use client";

import { ArrowLeft, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import MobileAppNav from "@/components/MobileAppNav";
import SiteHeader from "@/components/SiteHeader";

export default function SiteShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  const inPlanner = pathname.startsWith("/meal-planner");
  const focusedCooking = pathname.startsWith("/meal-planner/cook/");
  const welcome = pathname === "/meal-planner/welcome";

  if (!inPlanner) {
    return <div className="relative z-10"><SiteHeader />{children}{footer}</div>;
  }

  return (
    <div className="relative z-10 min-h-screen bg-[#0b1216] pb-20 md:pb-0">
      {!focusedCooking && <header className="sticky top-0 z-[60] border-b border-[var(--border)] bg-[#0b1216]/95 shadow-lg shadow-black/20 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/meal-planner" className="flex min-w-0 items-center gap-3" aria-label="Vegan Masala planner home">
            <Image src="/brand/logo-mark.png" alt="" width={38} height={38} className="h-10 w-10 rounded-xl object-contain" priority />
            <span className="min-w-0"><span className="block truncate text-lg font-extrabold leading-none text-[var(--brand-gold)]">Vegan Masala</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Meal planner</span></span>
          </Link>
          <div className="flex items-center gap-2">
            {!welcome && <Link href="/meal-planner/welcome" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-soft)] hover:bg-white/10 hover:text-white" aria-label="My preferences"><Settings aria-hidden="true" size={19} /></Link>}
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--text-soft)] hover:bg-white/10 hover:text-white"><ArrowLeft aria-hidden="true" size={16} /><span className="hidden sm:inline">Website</span></Link>
          </div>
        </div>
      </header>}
      {children}
      <MobileAppNav />
    </div>
  );
}
