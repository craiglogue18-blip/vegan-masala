"use client";

import { BookOpen, CalendarDays, ListPlus, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/meal-planner", label: "This week", icon: CalendarDays },
  { href: "/meal-planner/build", label: "Build", icon: ListPlus },
  { href: "/meal-planner/shopping", label: "Shopping", icon: ShoppingBasket },
  { href: "/meal-planner/recipes", label: "Recipes", icon: BookOpen },
];

export default function MobileAppNav() {
  const pathname = usePathname();

  if (!pathname.startsWith("/meal-planner") || pathname === "/meal-planner/welcome" || pathname.startsWith("/meal-planner/cook/")) return null;

  return (
    <nav aria-label="App navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--border)] bg-[#0b1216]/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/meal-planner" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-bold ${active ? "text-[var(--brand-gold)]" : "text-[var(--text-soft)]"}`}>
              <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
