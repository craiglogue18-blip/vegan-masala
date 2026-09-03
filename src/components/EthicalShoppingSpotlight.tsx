import Image from "next/image";
import Link from "next/link";

import AffiliateLink from "@/components/AffiliateLink";
import { ethicalSuperstoreAffiliateUrl } from "@/lib/affiliate";

const ranges = [
  {
    key: "indian-pantry",
    label: "Indian pantry",
    destination:
      "https://www.ethicalsuperstore.com/category/groceries-and-everyday/world-food/indian/",
  },
  {
    key: "pulses",
    label: "Lentils & pulses",
    destination:
      "https://www.ethicalsuperstore.com/category/groceries-and-everyday/pasta-rice-and-pulses/beans-and-pulses-dried/",
  },
  {
    key: "spices",
    label: "Vegan herbs & spices",
    destination:
      "https://www.ethicalsuperstore.com/category/groceries-and-everyday/store-cupboard/herbs-and-spices/vegan.htm",
  },
];

export default function EthicalShoppingSpotlight() {
  return (
    <section className="mt-12 overflow-hidden rounded-3xl border border-[#2bafe3]/45 bg-gradient-to-br from-white via-[#f7fcfe] to-[#e2f6fc] p-6 text-slate-900 shadow-sm sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="flex min-h-36 items-center justify-center rounded-2xl bg-white p-6 shadow-sm">
          <Image
            src="/images/affiliates/ethical-superstore-logo.png"
            alt="Ethical Superstore"
            width={274}
            height={114}
            className="h-auto w-full max-w-[190px] object-contain"
          />
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#087cac]">
            Affiliate partner · Optional shopping links
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            Stock your vegan Indian pantry more thoughtfully
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Explore relevant Ethical Superstore ranges for pulses, spices and cupboard
            essentials. If you buy through these links, Vegan Masala may earn a commission
            at no extra cost to you.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {ranges.map((range) => (
              <AffiliateLink
                key={range.key}
                href={ethicalSuperstoreAffiliateUrl(`homepage-${range.key}`, range.destination)}
                title={range.label}
                category="Homepage pantry"
                network="Awin"
                destinationLabel="Ethical Superstore"
                placement="homepage-pantry-spotlight"
                className="inline-flex min-h-11 items-center rounded-xl bg-[#087cac] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#06678f]"
              >
                {range.label} →
              </AffiliateLink>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Recommendations are selected for relevance. Read our{" "}
            <Link href="/affiliate-disclosure" className="font-bold underline">
              affiliate disclosure
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
