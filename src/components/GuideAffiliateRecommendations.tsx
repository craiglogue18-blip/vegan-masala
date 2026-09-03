import Image from "next/image";
import AffiliateCard from "@/components/AffiliateCard";
import AffiliateLink from "@/components/AffiliateLink";
import {
  AMAZON_PRODUCTS,
  amazonUkProductUrl,
  amazonUkSearchUrl,
  ethicalSuperstoreAffiliateUrl,
} from "@/lib/affiliate";

type Recommendation = {
  title: string;
  description: string;
  query?: string;
  asin?: string;
  image?: string;
  imageAlt?: string;
};

function recommendationUrl(item: Recommendation) {
  return item.asin ? amazonUkProductUrl(item.asin) : amazonUkSearchUrl(item.query ?? item.title);
}

const recommendationsByGuide: Record<string, Recommendation[]> = {
  "how-to-cook-basmati-rice": [
    {
      title: "Rice cooker",
      description: "Useful for consistent, hands-off basmati rice when rice is a regular part of your meals.",
      query: "rice cooker basmati rice",
      image: "/images/affiliate/equipment/rice-cooker.webp",
      imageAlt: "Compact rice cooker filled with basmati rice",
    },
    {
      title: AMAZON_PRODUCTS.sieve.name,
      description: "Makes it easy to rinse basmati thoroughly without losing grains through larger holes.",
      asin: AMAZON_PRODUCTS.sieve.asin,
      image: "/images/affiliate/equipment/sieve.webp",
      imageAlt: "Fine-mesh kitchen sieve",
    },
  ],
  "how-to-build-a-curry-base": [
    {
      title: AMAZON_PRODUCTS.heavyPot.name,
      description: "Steady heat helps onion, tomato and spice bases cook down without catching on the bottom.",
      asin: AMAZON_PRODUCTS.heavyPot.asin,
      image: "/images/affiliate/equipment/heavy-pot.webp",
      imageAlt: "Heavy-bottomed cooking pot on a hob",
    },
    {
      title: AMAZON_PRODUCTS.handBlender.name,
      description: "A convenient way to smooth curry bases directly in the pot with less transferring and washing up.",
      asin: AMAZON_PRODUCTS.handBlender.asin,
      image: "/images/affiliate/equipment/hand-blender.webp",
      imageAlt: "Immersion hand blender beside a blending jug",
    },
  ],
  "how-to-temper-spices": [
    {
      title: "Tadka pan",
      description: "Its small size keeps oil and whole spices together so you can bloom them quickly and pour safely.",
      query: "Indian tadka tempering pan",
      image: "/images/affiliate/equipment/tadka-pan.webp",
      imageAlt: "Small tadka pan for tempering spices",
    },
    {
      title: "Stainless-steel spice box",
      description: "Keeps frequently used tempering spices organised and close at hand while the oil is heating.",
      query: "Indian stainless steel masala dabba spice box",
      image: "/images/affiliate/equipment/spice-box.webp",
      imageAlt: "Open stainless-steel masala dabba filled with spices",
    },
  ],
  "lentils-and-dal": [
    {
      title: AMAZON_PRODUCTS.pressureCooker.name,
      description: "Cuts down the cooking time for lentils, chickpeas and beans, especially when cooking from dry.",
      asin: AMAZON_PRODUCTS.pressureCooker.asin,
      image: "/images/affiliate/equipment/pressure-cooker.webp",
      imageAlt: "Pressure cooker used for lentils and beans",
    },
    {
      title: AMAZON_PRODUCTS.heavyPot.name,
      description: "Helps dal simmer steadily with less risk of sticking as it thickens.",
      asin: AMAZON_PRODUCTS.heavyPot.asin,
      image: "/images/affiliate/equipment/heavy-pot.webp",
      imageAlt: "Heavy-bottomed cooking pot on a hob",
    },
  ],
  "vegan-indian-pantry-staples": [
    {
      title: "Airtight spice jars",
      description: "Protect spices from moisture and make a growing Indian pantry easier to organise.",
      query: "airtight glass spice jars labels",
      image: "/images/affiliate/equipment/spice-jars.webp",
      imageAlt: "Airtight glass jars filled with Indian spices",
    },
    {
      title: AMAZON_PRODUCTS.spiceGrinder.name,
      description: "Lets you buy whole spices and grind small, aromatic batches when you need them.",
      asin: AMAZON_PRODUCTS.spiceGrinder.asin,
      image: "/images/affiliate/equipment/spice-grinder.webp",
      imageAlt: "Kitchen spice grinder with whole spices",
    },
  ],
  "indian-spices-explained-for-beginners": [
    {
      title: AMAZON_PRODUCTS.spiceGrinder.name,
      description: "Freshly grinding toasted cumin, coriander and pepper gives beginner masalas a brighter aroma.",
      asin: AMAZON_PRODUCTS.spiceGrinder.asin,
      image: "/images/affiliate/equipment/spice-grinder.webp",
      imageAlt: "Kitchen spice grinder with whole spices",
    },
    {
      title: "Stainless-steel spice box",
      description: "Keeps core everyday spices visible and accessible while you learn how to combine them.",
      query: "Indian stainless steel masala dabba spice box",
      image: "/images/affiliate/equipment/spice-box.webp",
      imageAlt: "Open stainless-steel masala dabba filled with spices",
    },
  ],
};

const ethicalSuperstoreGuides: Record<string, { description: string; destinationUrl: string }> = {
  "vegan-indian-pantry-staples": {
    description: "Browse vegan cupboard staples and thoughtfully sourced ingredients for building your Indian pantry.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/world-food/indian/",
  },
  "seasonal-vegetables-for-indian-cooking": {
    description: "Explore organic groceries and ethical kitchen essentials to complement your seasonal cooking.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/",
  },
  "low-waste-vegan-indian-kitchen": {
    description: "Browse ethical household, refill and cupboard options that can support a lower-waste kitchen.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/",
  },
  "regional-indian-cooking": {
    description: "Explore ethically sourced rice, pulses and cupboard ingredients while learning how regional Indian cooking differs.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/world-food/indian/",
  },
  "weekly-vegan-indian-grocery-list": {
    description: "Browse vegan pantry essentials that can help turn the weekly list into a practical shop.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/world-food/indian/",
  },
  "lentils-and-dal": {
    description: "Browse dried lentils, chickpeas and beans for everyday dals and pulse-based curries.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/pasta-rice-and-pulses/beans-and-pulses-dried/",
  },
  "indian-spices-explained-for-beginners": {
    description: "Explore vegan herbs and spices while building a useful beginner Indian spice collection.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/store-cupboard/herbs-and-spices/vegan.htm",
  },
  "how-to-cook-basmati-rice": {
    description: "Browse basmati rice, grains and pulses to accompany everyday Indian meals.",
    destinationUrl: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/world-food/indian/",
  },
};

export default function GuideAffiliateRecommendations({ slug }: { slug: string }) {
  const recommendations = recommendationsByGuide[slug] ?? [];
  const ethicalRecommendation = ethicalSuperstoreGuides[slug];
  if (!recommendations.length && !ethicalRecommendation) return null;

  return (
    <section className="mt-10 rounded-3xl border border-[var(--brand-gold)]/35 bg-[var(--surface)]/95 p-6 shadow-sm sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
        Helpful kitchen picks
      </p>
      <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-gold)]">
        Useful tools for this guide
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
        These optional shopping links are selected for the guide above. We may earn a
        commission from qualifying purchases at no extra cost to you.
      </p>

      {recommendations.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2">
        {recommendations.map((item) => (
          <article
            key={item.title}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--brand-gold)]/30 bg-gradient-to-br from-black/20 to-[var(--brand-gold)]/5"
          >
            <AffiliateCard
              title={item.title}
              description={item.description}
              href={recommendationUrl(item)}
              category="Vegan Masala recommends"
              placement={`guide-${slug}`}
              imageSrc={item.image}
              imageAlt={item.imageAlt}
            />
          </article>
        ))}
      </div>}

      {ethicalRecommendation && (
        <article className="mt-6 grid gap-5 overflow-hidden rounded-2xl border border-[#2bafe3]/45 bg-gradient-to-br from-white to-[#eaf8fd] p-5 text-slate-900 sm:grid-cols-[180px_1fr] sm:items-center">
          <div className="flex min-h-24 items-center justify-center rounded-xl bg-white p-4 shadow-sm">
            <Image
              src="/images/affiliates/ethical-superstore-logo.png"
              alt="Ethical Superstore logo"
              width={274}
              height={114}
              className="h-auto w-full max-w-[170px] object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#087cac]">
              Affiliate partner
            </p>
            <h3 className="mt-1 text-xl font-extrabold">Shop with Ethical Superstore</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{ethicalRecommendation.description}</p>
            <AffiliateLink
              href={ethicalSuperstoreAffiliateUrl(
                `guide-${slug}`,
                ethicalRecommendation.destinationUrl,
              )}
              title="Ethical Superstore"
              category={`Guide: ${slug}`}
              network="Awin"
              destinationLabel="Ethical Superstore"
              placement={`guide-${slug}`}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#087cac] px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#06678f]"
            >
              Visit Ethical Superstore →
            </AffiliateLink>
          </div>
        </article>
      )}
    </section>
  );
}
