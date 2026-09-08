import Image from "next/image";

import AffiliateLink from "@/components/AffiliateLink";
import {
  ethicalSuperstoreAffiliateUrl,
  SPICE_KITCHEN_INDIAN_TIN_URL,
  spiceKitchenAffiliateUrl,
} from "@/lib/affiliate";

type RecipeLike = {
  slug: string;
  title?: string;
  ingredients?: string[];
  tags?: string[];
};

type PantryPick = {
  key: string;
  title: string;
  description: string;
  destinationUrl: string;
};

const destinations = {
  pulses: {
    key: "pulses",
    title: "Lentils, chickpeas and beans",
    description: "Browse dried pulses for dals, chana dishes and bean-based curries.",
    destinationUrl:
      "https://www.ethicalsuperstore.com/category/groceries-and-everyday/pasta-rice-and-pulses/beans-and-pulses-dried/",
  },
  spices: {
    key: "spices",
    title: "Vegan herbs and spices",
    description: "Browse vegan seasonings and pantry spices for building the masala.",
    destinationUrl:
      "https://www.ethicalsuperstore.com/category/groceries-and-everyday/store-cupboard/herbs-and-spices/vegan.htm",
  },
  indian: {
    key: "indian-pantry",
    title: "Indian pantry essentials",
    description: "Browse rice, pulses and Indian-inspired cupboard ingredients in one place.",
    destinationUrl:
      "https://www.ethicalsuperstore.com/category/groceries-and-everyday/world-food/indian/",
  },
} satisfies Record<string, PantryPick>;

export function getRecipePantryPicks(recipe: RecipeLike): PantryPick[] {
  const text = [
    recipe.title,
    recipe.slug,
    ...(recipe.ingredients ?? []),
    ...(recipe.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const picks: PantryPick[] = [];

  if (/\b(dal|dahl|lentils?|chickpeas?|chana|beans?|rajma|peas?|pulses?)\b/.test(text)) {
    picks.push(destinations.pulses);
  }

  if (/\b(cumin|coriander|turmeric|garam masala|cardamom|mustard seed|fenugreek|chilli|chili|pepper|spice|curry leaves)\b/.test(text)) {
    picks.push(destinations.spices);
  }

  if (picks.length < 2) picks.push(destinations.indian);

  return [...new Map(picks.map((pick) => [pick.key, pick])).values()].slice(0, 2);
}

export default function RecipePantryShopping({
  recipe,
  picks,
}: {
  recipe: RecipeLike;
  picks: PantryPick[];
}) {
  if (!picks.length) return null;
  const hasSpiceKitchenRecommendation = picks.some((pick) => pick.key === "spices");
  const cardCount = picks.length + (hasSpiceKitchenRecommendation ? 1 : 0);

  return (
    <aside
      id="shop-ingredients"
      className="mt-8 scroll-mt-[160px] rounded-[2rem] border border-[#2bafe3]/40 bg-gradient-to-br from-white to-[#eaf8fd] p-6 text-slate-900 shadow-sm sm:scroll-mt-[140px] lg:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#087cac]">
            Optional affiliate links
          </p>
          <h2 className="mt-1 text-xl font-extrabold">Shop the pantry for this recipe</h2>
        </div>
        <Image
          src="/images/affiliates/ethical-superstore-logo.png"
          alt="Ethical Superstore"
          width={274}
          height={114}
          className="h-auto w-28 rounded-lg bg-white p-2"
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">
        Relevant Ethical Superstore ranges for the ingredients above. We may earn a
        commission from a qualifying purchase, at no extra cost to you.
      </p>

      <div
        className={`mt-5 grid gap-4 md:grid-cols-2 ${
          cardCount >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        {picks.map((pick) => (
          <div key={pick.key} className="flex h-full flex-col rounded-2xl border border-sky-200 bg-white/85 p-5">
            <h3 className="font-extrabold text-slate-950">{pick.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-700">{pick.description}</p>
            <AffiliateLink
              href={ethicalSuperstoreAffiliateUrl(
                `recipe-${recipe.slug}-${pick.key}`,
                pick.destinationUrl,
              )}
              title={pick.title}
              category="Recipe pantry"
              network="Awin"
              destinationLabel="Ethical Superstore"
              placement={`recipe-${recipe.slug}`}
              className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-[#087cac] px-4 py-2 text-center text-sm font-extrabold text-white transition hover:bg-[#06678f]"
            >
              Browse {pick.title.toLowerCase()} →
            </AffiliateLink>
          </div>
        ))}
        {hasSpiceKitchenRecommendation ? (
          <div className="flex h-full flex-col rounded-2xl border border-amber-300 bg-[#fff8e6] p-5">
            <Image
              src="/images/affiliates/spice-kitchen-indian-spice-tin.png"
              alt="Spice Kitchen Indian Spice Tin with nine spices and blends"
              width={2000}
              height={2000}
              className="mx-auto h-28 w-28 rounded-xl object-contain"
            />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-800">
                Spice Kitchen · Affiliate partner
              </p>
              <h3 className="mt-1 font-extrabold text-slate-950">Nine core Indian spices in one tin</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                A giftable masala dabba with foundational spices, a spice spoon and a mini recipe book.
              </p>
              <AffiliateLink
                href={spiceKitchenAffiliateUrl(
                  `recipe-${recipe.slug}-spice-kitchen-tin`,
                  SPICE_KITCHEN_INDIAN_TIN_URL,
                )}
                title="Spice Kitchen Indian Spice Tin"
                category="Recipe pantry"
                network="Awin"
                destinationLabel="Spice Kitchen"
                placement={`recipe-${recipe.slug}`}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#8b3f22] px-4 py-2 text-center text-sm font-extrabold text-white transition hover:bg-[#71321b]"
              >
                View the Indian Spice Tin →
              </AffiliateLink>
              <p className="mt-2 text-xs text-slate-600">Paid affiliate link · No extra cost to you</p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
