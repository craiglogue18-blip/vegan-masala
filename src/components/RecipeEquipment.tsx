import AffiliateCard from "@/components/AffiliateCard";
import { AMAZON_PRODUCTS, amazonUkProductUrl } from "@/lib/affiliate";

type RecipeLike = {
  title?: string;
  slug?: string;
  description?: string;
  tags?: string[];
};

type EquipmentRecommendation = {
  name: string;
  asin: string;
  reason: string;
  image?: string;
  imageAlt?: string;
};

const tools = {
  pressureCooker: {
    name: AMAZON_PRODUCTS.pressureCooker.name,
    asin: AMAZON_PRODUCTS.pressureCooker.asin,
    reason: "Useful for getting chickpeas, beans and lentils tender without a long stovetop simmer.",
    image: "/images/affiliate/equipment/pressure-cooker.webp",
    imageAlt: "Pressure cooker in the Vegan Masala kitchen",
  },
  tawa: {
    name: AMAZON_PRODUCTS.tawa.name,
    asin: AMAZON_PRODUCTS.tawa.asin,
    reason: "A broad, flat surface helps breads and dosas cook evenly and develop their characteristic spots.",
    image: "/images/affiliate/equipment/tawa.webp",
    imageAlt: "Flat tawa used for Indian breads",
  },
  blender: {
    name: AMAZON_PRODUCTS.handBlender.name,
    asin: AMAZON_PRODUCTS.handBlender.asin,
    reason: "Helpful for smooth chutneys, batters and curry sauces without transferring large quantities by hand.",
    image: "/images/affiliate/equipment/hand-blender.webp",
    imageAlt: "Immersion hand blender beside a blending jug",
  },
  grinder: {
    name: AMAZON_PRODUCTS.spiceGrinder.name,
    asin: AMAZON_PRODUCTS.spiceGrinder.asin,
    reason: "Freshly ground whole spices give masalas a brighter aroma than long-opened ground spices.",
    image: "/images/affiliate/equipment/spice-grinder.webp",
    imageAlt: "Kitchen spice grinder with whole spices",
  },
  kadai: {
    name: AMAZON_PRODUCTS.kadai.name,
    asin: AMAZON_PRODUCTS.kadai.asin,
    reason: "The deep shape gives hot oil and bubbling masala room while keeping stirring and turning manageable.",
    image: "/images/affiliate/equipment/kadai.webp",
    imageAlt: "Kadai pan for Indian cooking",
  },
  heavyPot: {
    name: AMAZON_PRODUCTS.heavyPot.name,
    asin: AMAZON_PRODUCTS.heavyPot.asin,
    reason: "Steady heat helps rice, dal and slow-simmered sauces cook evenly without catching on the base.",
    image: "/images/affiliate/equipment/heavy-pot.webp",
    imageAlt: "Heavy-bottomed cooking pot on a hob",
  },
  sieve: {
    name: AMAZON_PRODUCTS.sieve.name,
    asin: AMAZON_PRODUCTS.sieve.asin,
    reason: "Handy for rinsing rice and lentils thoroughly and draining them without losing smaller grains.",
    image: "/images/affiliate/equipment/sieve.webp",
    imageAlt: "Fine-mesh kitchen sieve",
  },
  idliSteamer: {
    name: AMAZON_PRODUCTS.idliSteamer.name,
    asin: AMAZON_PRODUCTS.idliSteamer.asin,
    reason: "The stacked plates steam several evenly shaped idlis together without taking over the hob.",
    image: "/images/affiliate/equipment/idli-steamer.webp",
    imageAlt: "Stainless-steel idli steamer with stacked mould plates",
  },
  miniChopper: {
    name: AMAZON_PRODUCTS.miniChopper.name,
    asin: AMAZON_PRODUCTS.miniChopper.asin,
    reason: "Useful for small batches of nuts, aromatics, chutneys and pastes where a full-size processor is unnecessary.",
    image: "/images/affiliate/equipment/mini-chopper.webp",
    imageAlt: "Compact mini chopper with ginger, garlic and chilli",
  },
} satisfies Record<string, EquipmentRecommendation>;

export function getRecipeEquipment(recipe: RecipeLike): EquipmentRecommendation[] {
  const text = [recipe.title, recipe.slug, ...(recipe.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(instant pot|pressure cooker)\b/.test(text)) return [tools.pressureCooker, tools.grinder];
  if (/\b(idli|idly)\b/.test(text)) return [tools.idliSteamer];
  if (/\b(naan|roti|chapati|poori|dosa|paratha|flatbread)\b/.test(text)) return [tools.tawa];
  if (/\b(pancakes?|cheela|chilla)\b/.test(text)) return [tools.tawa];
  if (/\b(chutney|lassi)\b/.test(text)) return [tools.blender, tools.grinder];
  if (/\b(pakora|bhaji|samosa|jalebi|gobi 65|cauliflower 65|vada pav|aloo tikki)\b/.test(text)) {
    return [tools.kadai];
  }
  if (/\b(biryani|pulao|pulav|pilau|rice)\b/.test(text)) return [tools.heavyPot, tools.sieve];
  if (/\b(dal|dahl|dhal|lentils?|rajma|kidney beans?|blackeye|black-eyed|kala chana|chole)\b/.test(text)) {
    return [tools.heavyPot, tools.pressureCooker];
  }
  if (/\b(curry|curried|masala|korma|kurma|vindaloo|madras|makhani|makhanwala|saag|palak|bhuna|dum aloo|dalna)\b/.test(text)) {
    return [tools.heavyPot, tools.grinder];
  }
  if (/\b(upma|aloo|potato|cauliflower|gobi|tandoori|tikka|tofu|bhurji|pasanda|kondattam)\b/.test(text)) {
    return [tools.kadai, tools.grinder];
  }
  if (/\b(barfi|burfi|katli|rasgulla|gulab jamun|laddu|ladoo|sweet|dessert|balls)\b/.test(text)) {
    return [tools.miniChopper, tools.kadai];
  }

  return [];
}

export default function RecipeEquipment({
  items,
  recipeSlug,
}: {
  items: EquipmentRecommendation[];
  recipeSlug: string;
}) {
  if (!items.length) return null;

  return (
    <section id="equipment" className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-6 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
        Useful equipment
      </p>
      <h2 className="mt-2 text-xl font-extrabold text-[var(--brand-gold)]">
        Tools that make this recipe easier
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
        These are optional paid links to relevant Amazon UK product examples. If you make a
        qualifying purchase, Vegan Masala may earn a commission at no extra cost to you.
      </p>

      <div className={`mt-5 grid gap-4 ${items.length > 1 ? "md:grid-cols-2" : ""}`}>
        {items.map((item) => (
          <article
            key={item.name}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--brand-gold)]/35 bg-gradient-to-br from-black/20 to-[var(--brand-gold)]/5"
          >
            <AffiliateCard
              title={item.name}
              description={item.reason}
              href={amazonUkProductUrl(item.asin)}
              category="Vegan Masala recommends"
              placement={`recipe-${recipeSlug}-equipment`}
              imageSrc={item.image}
              imageAlt={item.imageAlt}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
