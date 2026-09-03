import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "How affiliate links help support Vegan Masala's free recipes and guides.",
};

export default function AffiliateDisclosurePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">Affiliate Disclosure</h1>
      <div className="mt-8 space-y-6 leading-7 text-[var(--text-soft)]">
        <p>
          Some Vegan Masala pages contain affiliate links. If you follow one of
          these links and make a qualifying purchase, Vegan Masala may receive a
          small commission at no additional cost to you.
        </p>
        <p>
          Affiliate links are labelled clearly near the recommendation. Commercial
          relationships do not determine which recipes, techniques or equipment we
          discuss, and readers should choose products that suit their own kitchen,
          budget and needs.
        </p>
        <p className="font-bold text-[var(--brand-gold)]">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
        <p>
          Vegan Masala participates in the Ethical Superstore affiliate programme
          through Awin and may also participate in programmes operated by selected
          food, grocery and kitchenware retailers. Where these links are present,
          the retailer is named and the link is identified as a paid affiliate link.
        </p>
      </div>
    </main>
  );
}
