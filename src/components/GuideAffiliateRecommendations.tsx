import AffiliateCard from "@/components/AffiliateCard";
import { amazonUkSearchUrl } from "@/lib/affiliate";

type Recommendation = {
  title: string;
  description: string;
  query: string;
};

const recommendationsByGuide: Record<string, Recommendation[]> = {
  "how-to-cook-basmati-rice": [
    {
      title: "Rice cooker",
      description: "Useful for consistent, hands-off basmati rice when rice is a regular part of your meals.",
      query: "rice cooker basmati rice",
    },
    {
      title: "Fine-mesh sieve",
      description: "Makes it easy to rinse basmati thoroughly without losing grains through larger holes.",
      query: "fine mesh kitchen sieve rice",
    },
  ],
  "how-to-build-a-curry-base": [
    {
      title: "Heavy-bottomed cooking pot",
      description: "Steady heat helps onion, tomato and spice bases cook down without catching on the bottom.",
      query: "heavy bottom casserole cooking pot",
    },
    {
      title: "Stick blender",
      description: "A convenient way to smooth curry bases directly in the pot with less transferring and washing up.",
      query: "stick blender hand blender",
    },
  ],
  "how-to-temper-spices": [
    {
      title: "Tadka pan",
      description: "Its small size keeps oil and whole spices together so you can bloom them quickly and pour safely.",
      query: "Indian tadka tempering pan",
    },
    {
      title: "Stainless-steel spice box",
      description: "Keeps frequently used tempering spices organised and close at hand while the oil is heating.",
      query: "Indian stainless steel masala dabba spice box",
    },
  ],
  "lentils-and-dal": [
    {
      title: "Pressure cooker or Instant Pot",
      description: "Cuts down the cooking time for lentils, chickpeas and beans, especially when cooking from dry.",
      query: "electric pressure cooker Instant Pot",
    },
    {
      title: "Heavy-bottomed cooking pot",
      description: "Helps dal simmer steadily with less risk of sticking as it thickens.",
      query: "heavy bottom casserole cooking pot",
    },
  ],
  "vegan-indian-pantry-staples": [
    {
      title: "Airtight spice jars",
      description: "Protect spices from moisture and make a growing Indian pantry easier to organise.",
      query: "airtight glass spice jars labels",
    },
    {
      title: "Electric spice grinder",
      description: "Lets you buy whole spices and grind small, aromatic batches when you need them.",
      query: "electric spice grinder",
    },
  ],
  "indian-spices-explained-for-beginners": [
    {
      title: "Electric spice grinder",
      description: "Freshly grinding toasted cumin, coriander and pepper gives beginner masalas a brighter aroma.",
      query: "electric spice grinder",
    },
    {
      title: "Stainless-steel spice box",
      description: "Keeps core everyday spices visible and accessible while you learn how to combine them.",
      query: "Indian stainless steel masala dabba spice box",
    },
  ],
};

export default function GuideAffiliateRecommendations({ slug }: { slug: string }) {
  const recommendations = recommendationsByGuide[slug] ?? [];
  if (!recommendations.length) return null;

  return (
    <section className="mt-10 rounded-3xl border border-[var(--brand-gold)]/35 bg-[var(--surface)]/95 p-6 shadow-sm sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
        Helpful kitchen picks
      </p>
      <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-gold)]">
        Useful tools for this guide
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
        These optional Amazon UK links are selected for the task explained above. We may
        earn a commission from qualifying purchases at no extra cost to you.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {recommendations.map((item) => (
          <article
            key={item.title}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--brand-gold)]/30 bg-gradient-to-br from-black/20 to-[var(--brand-gold)]/5"
          >
            <AffiliateCard
              title={item.title}
              description={item.description}
              href={amazonUkSearchUrl(item.query)}
              category="Vegan Masala recommends"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
