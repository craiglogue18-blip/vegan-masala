import AffiliateLink from "@/components/AffiliateLink";

type AffiliateCardProps = {
  title: string;
  description: string;
  href: string;
  tip?: string;
  category?: string;
};

export default function AffiliateCard({
  title,
  description,
  href,
  tip,
  category = "Recommended kitchen tool",
}: AffiliateCardProps) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--brand-gold)]/10 blur-2xl"
      />

      <div className="relative flex flex-1 flex-col">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10"
          >
            ✦
          </span>
          {category}
        </p>

        <h3 className="mt-4 text-lg font-extrabold tracking-tight text-[var(--brand-gold)]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{description}</p>

        {tip && (
          <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
            <span className="font-bold text-[var(--text)]">Tip:</span> {tip}
          </p>
        )}

        <div className="mt-auto pt-6">
          <AffiliateLink
            href={href}
            title={title}
            category={category}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--brand-gold)] px-5 py-3 text-center text-sm font-extrabold text-[var(--bg)] shadow-[0_8px_24px_rgba(214,178,94,0.18)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
          >
            View on Amazon UK
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </AffiliateLink>
          <p className="mt-3 text-center text-xs text-[var(--text-soft)]/75">
            Paid affiliate link · No extra cost to you
          </p>
        </div>
      </div>
    </div>
  );
}
