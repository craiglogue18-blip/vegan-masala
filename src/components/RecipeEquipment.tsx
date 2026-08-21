type RecipeLike = {
  title?: string;
  slug?: string;
  description?: string;
  tags?: string[];
};

type EquipmentRecommendation = {
  name: string;
  query: string;
  reason: string;
};

const ASSOCIATES_TAG = "veganmasala03-21";

const tools = {
  pressureCooker: {
    name: "Pressure cooker or Instant Pot",
    query: "electric pressure cooker Instant Pot",
    reason: "Useful for getting chickpeas, beans and lentils tender without a long stovetop simmer.",
  },
  tawa: {
    name: "Cast-iron tawa",
    query: "cast iron tawa chapati pan",
    reason: "A broad, flat surface helps breads and dosas cook evenly and develop their characteristic spots.",
  },
  blender: {
    name: "Blender or food processor",
    query: "compact blender food processor",
    reason: "Helpful for smooth chutneys, batters and curry sauces without transferring large quantities by hand.",
  },
  grinder: {
    name: "Electric spice grinder",
    query: "electric spice grinder",
    reason: "Freshly ground whole spices give masalas a brighter aroma than long-opened ground spices.",
  },
  kadai: {
    name: "Kadai or deep frying pan",
    query: "Indian kadai karahi pan",
    reason: "The deep shape gives hot oil and bubbling masala room while keeping stirring and turning manageable.",
  },
  heavyPot: {
    name: "Heavy-bottomed cooking pot",
    query: "heavy bottom casserole pot",
    reason: "Steady heat helps rice, dal and slow-simmered sauces cook evenly without catching on the base.",
  },
  sieve: {
    name: "Fine-mesh sieve",
    query: "fine mesh kitchen sieve",
    reason: "Handy for rinsing rice and lentils thoroughly and draining them without losing smaller grains.",
  },
} satisfies Record<string, EquipmentRecommendation>;

export function getRecipeEquipment(recipe: RecipeLike): EquipmentRecommendation[] {
  const text = [recipe.title, recipe.slug, ...(recipe.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(instant pot|pressure cooker)\b/.test(text)) return [tools.pressureCooker, tools.grinder];
  if (/\b(naan|roti|chapati|poori|dosa|paratha|flatbread)\b/.test(text)) return [tools.tawa];
  if (/\b(chutney|lassi)\b/.test(text)) return [tools.blender, tools.grinder];
  if (/\b(pakora|bhaji|samosa|jalebi|gobi 65|cauliflower 65|vada pav)\b/.test(text)) {
    return [tools.kadai];
  }
  if (/\b(biryani|pulao|pulav|pilau|rice)\b/.test(text)) return [tools.heavyPot, tools.sieve];
  if (/\b(dal|dahl|lentils?|rajma|kidney beans?|blackeye|black-eyed|kala chana)\b/.test(text)) {
    return [tools.heavyPot, tools.pressureCooker];
  }

  return [];
}

const amazonSearch = (query: string) =>
  `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&tag=${ASSOCIATES_TAG}`;

export default function RecipeEquipment({ items }: { items: EquipmentRecommendation[] }) {
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
        These are optional paid links to useful Amazon UK searches. If you make a
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
              href={amazonSearch(item.query)}
              category="Vegan Masala recommends"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
import AffiliateCard from "@/components/AffiliateCard";
