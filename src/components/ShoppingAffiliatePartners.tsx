import AffiliateLink from "@/components/AffiliateLink";
import { ethicalSuperstoreAffiliateUrl } from "@/lib/affiliate";

const partners = [
  {
    name: "Ethical Superstore",
    description: "Vegan cupboard ingredients and ethical household essentials.",
    url:
      process.env.NEXT_PUBLIC_ETHICAL_SUPERSTORE_AFFILIATE_URL ||
      ethicalSuperstoreAffiliateUrl("meal-planner-shopping"),
    network: "Awin",
  },
  {
    name: "Abel & Cole",
    description: "Organic fruit, vegetables and flexible grocery deliveries.",
    url: process.env.NEXT_PUBLIC_ABEL_AND_COLE_AFFILIATE_URL,
    network: "Abel & Cole",
  },
  {
    name: "Lakeland",
    description: "Practical cookware, storage and kitchen equipment.",
    url: process.env.NEXT_PUBLIC_LAKELAND_AFFILIATE_URL,
    network: "Lakeland",
  },
  {
    name: "Ninja Kitchen",
    description: "Blenders, food processors, air fryers and multi-cookers.",
    url: process.env.NEXT_PUBLIC_NINJA_AFFILIATE_URL,
    network: "Ninja Kitchen",
  },
].filter((partner): partner is typeof partner & { url: string } => Boolean(partner.url));

export default function ShoppingAffiliatePartners() {
  if (partners.length === 0) return null;

  return (
    <aside className="mt-7 rounded-2xl border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/5 p-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]">
        Optional shopping partners
      </p>
      <h3 className="mt-2 text-2xl">Shop your week</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
        These shops may help with fresh produce, specialist ingredients or useful kitchen equipment.
        Links are paid affiliate links, at no extra cost to you.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {partners.map((partner) => (
          <div key={partner.name} className="flex flex-col rounded-xl border border-[var(--border)] bg-black/20 p-4">
            <p className="font-extrabold text-white">{partner.name}</p>
            <p className="mt-1 flex-1 text-sm leading-6 text-[var(--text-soft)]">{partner.description}</p>
            <AffiliateLink
              href={partner.url}
              title={partner.name}
              category="Weekly shopping partner"
              network={partner.network}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-extrabold text-black hover:brightness-110"
            >
              Visit {partner.name} →
            </AffiliateLink>
          </div>
        ))}
      </div>
    </aside>
  );
}
