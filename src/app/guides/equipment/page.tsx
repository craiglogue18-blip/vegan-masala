import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://vegan-masala.com";

export const metadata: Metadata = {
  title: "Indian Cooking Equipment Guide",
  description:
    "Discover the essential tools for Indian cooking, what each one does, and which pieces of equipment are worth buying first.",
  alternates: {
    canonical: `${siteUrl}/guides/equipment`,
  },
  openGraph: {
    title: "Indian Cooking Equipment Guide | Vegan Masala",
    description:
      "Discover the essential tools for Indian cooking, what each one does, and which pieces of equipment are worth buying first.",
    url: `${siteUrl}/guides/equipment`,
    siteName: "Vegan Masala",
    type: "article",
  },
};

function GuideImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0" />
    </div>
  );
}

const amazonSearch = (query: string) =>
  `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&tag=veganmasala03-21`;

const equipment = [
  {
    name: "Tadka pan (tempering pan)",
    image: "/images/equipment/tadka.jpg",
    alt: "Small tadka pan for tempering spices in oil",
    why: "Perfect for blooming spices in oil (tadka) and pouring over dal, chana, and curries.",
    tip: "Keep it small — spices bloom fast and can burn.",
    shopQuery: "Indian tadka tempering pan",
  },
  {
    name: "Kadai / Karahi (wok-like pan)",
    image: "/images/equipment/kadai.jpeg",
    alt: "Kadai (karahi) pan",
    why: "Great for stir-frying, bhaji-style dishes, and quick curries.",
    tip: "Hot pan + quick movement = better flavour and texture.",
    shopQuery: "Indian kadai karahi pan",
  },
  {
    name: "Tawa (flat griddle)",
    image: "/images/equipment/tawa.jpg",
    alt: "Tawa for cooking rotis and flatbreads",
    why: "Essential for rotis, chapatis, parathas, and toasting spices.",
    tip: "Heat until a sprinkle of water dances; don’t oil for chapati.",
    shopQuery: "cast iron tawa chapati pan",
  },
  {
    name: "Heavy-bottom pot / Dutch oven",
    image: "/images/equipment/dutch_oven.jpeg",
    alt: "Heavy-bottom pot or Dutch oven on a stovetop",
    why: "Best for curries and dals: even heat prevents sticking and scorching.",
    tip: "Use medium heat and stir after adding tomatoes or purées.",
    shopQuery: "heavy bottom casserole pot",
  },
  {
    name: "Pressure cooker / Instant Pot",
    image: "/images/equipment/pressure_cooker.jpg",
    alt: "Pressure cooker used for lentils and beans",
    why: "Speeds up lentils, chickpeas, and beans — weeknight game-changer.",
    tip: "Finish with tadka for best flavour.",
    shopQuery: "electric pressure cooker Instant Pot",
  },
  {
    name: "Spice grinder / coffee grinder",
    image: "/images/equipment/spice_grinder.jpg",
    alt: "Spice grinder with whole spices",
    why: "Fresh-ground spices taste dramatically better (cumin, coriander, pepper).",
    tip: "Grind small batches and keep in a sealed jar.",
    shopQuery: "electric spice grinder",
  },
  {
    name: "Mortar & pestle",
    image: "/images/equipment/pestle_morter.jpg",
    alt: "Mortar and pestle for crushing spices",
    why: "Crush ginger/garlic, chilli, and whole spices for pastes and marinades.",
    tip: "A rough paste is often better than perfectly smooth.",
    shopQuery: "granite mortar and pestle",
  },
  {
    name: "Fine mesh strainer (sieve)",
    image: "/images/equipment/sieve.jpg",
    alt: "Fine mesh sieve",
    why: "Great for rinsing lentils and straining chai or stocks.",
    tip: "Rinse lentils until water runs clearer for cleaner flavour.",
    shopQuery: "fine mesh kitchen sieve",
  },
  {
    name: "Wooden spoon",
    image: "/images/equipment/wooden_spoon.jpg",
    alt: "Wooden spoon for stirring curries",
    why: "Simple but essential — great for stirring without scratching pans.",
    tip: "Stir after adding tomatoes to prevent catching at the bottom.",
    shopQuery: "wooden cooking spoon",
  },
];

export default function EquipmentGuidePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="text-sm font-medium text-[var(--brand-ink)]/70">Guides</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--brand-ink)]">
          Indian cooking equipment
        </h1>
        <p className="mt-4 max-w-3xl text-[var(--brand-ink)]/70">
          You don’t need a full kitchen makeover — a few key tools make Indian cooking easier, faster,
          and more consistent.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/guides"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--brand-ink)] hover:bg-white/5"
          >
            Back to guides
          </Link>
          <Link
            href="/recipes"
            className="rounded-xl bg-[var(--brand-teal)] px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Browse recipes
          </Link>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--brand-ink)]">
          Tools that help most
        </h2>
        <p className="mt-2 max-w-3xl text-[var(--brand-ink)]/70">
          Start with a heavy pot, a good pan, and one way to grind spices. Add a pressure cooker later if you want speed.
        </p>

        <div className="mt-5 max-w-3xl rounded-2xl border border-[var(--brand-gold)]/35 bg-[var(--surface)] px-5 py-4 text-sm leading-6 text-[var(--brand-ink)]/75">
          <span className="font-bold text-[var(--brand-ink)]">Affiliate disclosure:</span>{" "}
          The Amazon links below are paid links. If you make a qualifying purchase,
          Vegan Masala may earn a commission at no extra cost to you. The links open
          useful search results rather than claiming one untested product is best.
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((e) => (
            <article
              key={e.name}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:bg-white/5"
            >
              <div className="p-4">
                <GuideImage src={e.image} alt={e.alt} />
              </div>

              <div className="px-6 pb-6">
                <h3 className="text-base font-semibold tracking-tight text-[var(--brand-ink)]">
                  {e.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/70">{e.why}</p>
                <p className="mt-3 text-sm text-[var(--brand-ink)]/70">
                  <span className="font-medium text-[var(--brand-ink)]">Tip:</span> {e.tip}
                </p>
                <a
                  href={amazonSearch(e.shopQuery)}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  className="mt-5 inline-flex rounded-xl bg-[var(--brand-teal)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  aria-label={`Browse ${e.name} on Amazon UK — paid link`}
                >
                  Browse on Amazon UK <span className="ml-1 font-normal">(paid link)</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--brand-ink)]">
          Next: spices + herbs
        </h2>
        <p className="mt-2 text-[var(--brand-ink)]/70">
          Tools help with consistency — spices and herbs bring the magic.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/guides/spices"
            className="rounded-xl bg-[var(--brand-teal)] px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Indian spices guide
          </Link>
          <Link
            href="/guides/herbs"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--brand-ink)] hover:bg-white/5"
          >
            Herbs guide
          </Link>
        </div>
      </section>
    </main>
  );
}
