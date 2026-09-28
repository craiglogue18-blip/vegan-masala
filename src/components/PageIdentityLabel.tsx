import type { ReactNode } from "react";

export default function PageIdentityLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-fit rounded-full border border-[var(--brand-gold)]/60 bg-black/20 px-4 py-1 text-xs font-normal leading-5 uppercase tracking-[0.2em] text-[var(--brand-gold)]/80">
      {children}
    </div>
  );
}
