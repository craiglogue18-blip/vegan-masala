import Image from "next/image";
import AffiliateLink from "@/components/AffiliateLink";

type AffiliateCardProps = {
  title: string;
  description: string;
  href: string;
  tip?: string;
  category?: string;
  network?: string;
  buttonLabel?: string;
  placement?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export default function AffiliateCard({
  title,
  description,
  href,
  tip,
  category = "Recommended kitchen tool",
  network = "Amazon UK",
  buttonLabel = "View on Amazon UK",
  placement,
  imageSrc,
  imageAlt,
}: AffiliateCardProps) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--brand-gold)]/10 blur-2xl"
      />

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className={imageSrc ? "grid grid-cols-[minmax(0,1fr)_6.5rem] gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem]" : ""}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold)]">
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10"
              >
                ✦
              </span>
              {category}
            </p>

            <h3 className="mt-3 text-lg font-extrabold tracking-tight text-[var(--brand-gold)]">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
          </div>

          {imageSrc && (
            <div className="relative mt-7 aspect-square w-full self-start overflow-hidden rounded-xl border border-[var(--brand-gold)]/30 bg-black/20 shadow-sm">
              <Image
                src={imageSrc}
                alt={imageAlt ?? title}
                fill
                className="object-cover transition duration-300 hover:scale-[1.02]"
                sizes="120px"
              />
            </div>
          )}
        </div>

        {tip && (
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            <span className="font-bold text-[var(--text)]">Tip:</span> {tip}
          </p>
        )}

        <div className="mt-auto pt-4">
          <AffiliateLink
            href={href}
            title={title}
            category={category}
            network={network}
            placement={placement}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--brand-gold)] px-5 py-3 text-center text-sm font-extrabold text-[var(--bg)] shadow-[0_8px_24px_rgba(214,178,94,0.18)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
          >
            {buttonLabel}
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
