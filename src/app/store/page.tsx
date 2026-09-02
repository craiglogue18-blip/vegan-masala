import Image from "next/image";

const PAYHIP_PRODUCT_URL = "https://payhip.com/b/Qna1A";

export const metadata = {
  title: "Vegan Indian Sweets Ebook | Vegan Masala Shop",
  description:
    "The original 23-page Vegan Indian Sweets ebook with six comforting recipes, pantry guidance, troubleshooting help and festive serving ideas.",
  alternates: { canonical: "/store" },
};

export default function EbookPage() {
  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8 lg:px-10">
        <section className="relative grid gap-10 overflow-hidden rounded-[2.25rem] border border-[var(--brand-gold)]/45 bg-black/70 p-6 shadow-2xl sm:p-9 lg:grid-cols-2 lg:items-center lg:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--brand-red)]/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-[var(--brand-gold)]/10 blur-3xl" />
          <div className="order-1">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
              Original illustrated edition
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-yellow-400 md:text-5xl">
              Vegan Indian Sweets
            </h1>

            <p className="mb-6 text-lg leading-8 text-zinc-200">
              Six celebration-worthy recipes in the original Vegan Masala design.
            </p>

            <p className="mb-6 text-base leading-8 text-zinc-300">
              A richly illustrated 23-page guide to jalebi, vegan gulab jamun,
              coconut ladoo, kheer, carrot halwa and mango lassi, presented with
              the original framed photography and distinctive Vegan Masala styling.
            </p>

            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-yellow-500/30 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200">
                6 complete sweet recipes
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200">
                23 originally designed pages
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200">
                Instant PDF download
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200">
                Pantry notes + troubleshooting
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href={PAYHIP_PRODUCT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Buy the ebook for £5
              </a>

              <a
                href="#inside"
                className="inline-flex rounded-full border border-yellow-500 px-6 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/10"
              >
                Preview What&apos;s Inside
              </a>
            </div>

            <p className="mt-6 text-sm text-zinc-400">
              One payment. Instant PDF delivery. Keep it and cook from it whenever you like.
            </p>
          </div>

          <div className="order-2">
            <div className="vm-float mx-auto max-w-md overflow-hidden rounded-[2rem] border border-[var(--brand-gold)]/80 bg-zinc-950 p-3 shadow-2xl shadow-black/60">
              <Image
                src="/images/ebook/cover.jpg"
                alt="Original Vegan Indian Sweets ebook cover"
                width={1600}
                height={2560}
                className="h-auto w-full rounded-[1.5rem]"
                priority
              />
            </div>
          </div>
        </section>

        <section className="relative mt-10 min-h-[360px] overflow-hidden rounded-[2rem] border border-[var(--brand-gold)]/45 shadow-2xl sm:min-h-[430px]">
          <Image
            src="/images/ebook/shop-hero.png"
            alt="Jalebi, vegan gulab jamun and coconut ladoo arranged for a Vegan Masala celebration"
            fill
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="object-cover object-[68%_center] sm:object-center"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#071719] via-[#071719]/80 to-transparent" />
          <div className="relative z-10 flex min-h-[360px] max-w-xl flex-col justify-center p-7 sm:min-h-[430px] sm:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              A little celebration at home
            </p>
            <h2 className="mt-4 text-3xl leading-tight text-white sm:text-5xl">
              Make something worth sharing.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--text-soft)] sm:text-lg sm:leading-8">
              From crisp jalebi to syrupy gulab jamun and soft coconut ladoo,
              the original illustrated guide brings six comforting recipes together
              in one unmistakably Vegan Masala collection.
            </p>
            <a
              href={PAYHIP_PRODUCT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-fit rounded-full bg-[var(--brand-gold)] px-6 py-3 font-extrabold text-black transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Get the ebook for £5
            </a>
          </div>
        </section>

        <section className="mt-16 grid gap-8 rounded-[2rem] border border-[var(--brand-gold)]/40 bg-[var(--surface)] p-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold text-yellow-400">
              What&apos;s Inside
            </h2>
            <p className="mb-6 leading-8 text-zinc-300">
              More than a bundle of recipes: the original edition combines practical
              guidance with the layered photography, frames and branded page design
              that make it feel like a complete little cookbook.
            </p>
            <ul className="space-y-3 text-zinc-200">
              <li>• Jalebi</li>
              <li>• Vegan Gulab Jamun</li>
              <li>• Coconut Ladoo</li>
              <li>• Kheer</li>
              <li>• Carrot Halwa</li>
              <li>• Mango Lassi</li>
              <li>• Pantry essentials for vegan Indian sweets</li>
              <li>• Troubleshooting common problems</li>
              <li>• Festive serving ideas</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-3xl font-bold text-yellow-400">
              Who It&apos;s For
            </h2>
            <p className="leading-8 text-zinc-300">
              It is for curious beginners and confident home cooks who want dependable
              guidance without losing the warmth and character of Indian sweet-making.
              Keep it on your phone or tablet while you cook, or print the pages you use most.
            </p>
          </div>
        </section>

        <section id="inside" className="mt-20">
          <h2 className="mb-4 text-3xl font-bold text-yellow-400">
            A Look Inside
          </h2>
          <p className="mb-8 max-w-3xl leading-8 text-zinc-300">
            Inside the ebook, you&apos;ll find beautifully designed recipe
            spreads, clear ingredient and method pages, helpful timing notes,
            and practical details to make each recipe feel more manageable and
            rewarding.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="overflow-hidden rounded-[1.5rem] border border-yellow-500/50 bg-zinc-950 p-3">
              <Image
                src="/images/ebook/contents.jpg"
                alt="Original ebook contents page preview"
                width={1600}
                height={2560}
                className="h-auto w-full rounded-[1rem]"
              />
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-yellow-500/50 bg-zinc-950 p-3">
              <Image
                src="/images/ebook/jalebi-intro.jpg"
                alt="Original jalebi recipe introduction preview"
                width={1600}
                height={2560}
                className="h-auto w-full rounded-[1rem]"
              />
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-yellow-500/50 bg-zinc-950 p-3">
              <Image
                src="/images/ebook/jalebi-recipe-1.jpg"
                alt="Original framed jalebi ingredients and method page preview"
                width={1600}
                height={2560}
                className="h-auto w-full rounded-[1rem]"
              />
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-8 rounded-[2rem] border border-yellow-500/40 bg-zinc-950/60 p-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold text-yellow-400">
              Why This Ebook
            </h2>
            <p className="mb-6 leading-8 text-zinc-300">
              Rather than jumping between tabs or piecing together scattered
              recipes, this ebook gives you one polished, easy-to-follow guide
              you can actually keep and reuse. It&apos;s designed to feel more
              curated, more usable, and more giftable than a loose collection of
              recipe notes.
            </p>

            <ul className="space-y-3 text-zinc-200">
              <li>• Beautifully designed PDF format</li>
              <li>• Beginner-friendly structure</li>
              <li>• Vegan-friendly ingredients</li>
              <li>• Practical notes you can actually use</li>
              <li>• Great for festive cooking and gifting</li>
              <li>• Instant digital download</li>
            </ul>
          </div>

          <div
            id="buy"
            className="rounded-[1.5rem] border border-yellow-500/50 bg-black/50 p-6"
          >
            <h2 className="mb-4 text-3xl font-bold text-yellow-400">
              Get the Ebook
            </h2>
            <p className="mb-4 leading-8 text-zinc-300">
              Buy once and keep it ready for whenever you want to make
              something sweet, comforting, and worth sharing.
            </p>

            <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-zinc-950/60 p-4">
              <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">
                You&apos;ll get
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-200">
                <li>• 6 vegan Indian sweet recipes</li>
                <li>• Pantry notes and ingredient help</li>
                <li>• Troubleshooting tips</li>
                <li>• Festive serving inspiration</li>
                <li>• The original 23-page framed design</li>
                <li>• Instant PDF delivery by email</li>
              </ul>
            </div>

            <div className="mb-4 text-2xl font-bold text-white">£5.00</div>

            <a
              href={PAYHIP_PRODUCT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[var(--brand-gold)] px-8 py-4 text-lg font-extrabold text-black transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Buy securely with Payhip
            </a>

            <p className="mt-4 text-sm text-zinc-500">
              Delivered instantly after purchase.
            </p>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-yellow-500/40 bg-zinc-950/60 p-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-yellow-400">
            Ready to make vegan Indian sweets at home?
          </h2>
          <p className="mx-auto max-w-3xl leading-8 text-zinc-300">
            Download the original Vegan Indian Sweets Ebook and keep a beautiful,
            practical collection of sweet recipes ready for whenever you want to
            cook something warm, nostalgic, and worth sharing.
          </p>

          <div className="mt-8">
            <a
              href={PAYHIP_PRODUCT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Buy the Ebook for £5
            </a>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="mb-8 text-3xl font-bold text-yellow-400">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-yellow-500/30 bg-zinc-950/50 p-6">
              <h3 className="mb-2 text-xl font-semibold text-white">
                What format is the ebook in?
              </h3>
              <p className="leading-8 text-zinc-300">
                The ebook is delivered as a downloadable PDF.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-yellow-500/30 bg-zinc-950/50 p-6">
              <h3 className="mb-2 text-xl font-semibold text-white">
                Will I receive it straight away?
              </h3>
              <p className="leading-8 text-zinc-300">
                Yes. Once your purchase is complete, you&apos;ll receive a
                download link by email.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-yellow-500/30 bg-zinc-950/50 p-6">
              <h3 className="mb-2 text-xl font-semibold text-white">
                Are all the recipes vegan?
              </h3>
              <p className="leading-8 text-zinc-300">
                Yes. Every recipe in the ebook is written using vegan
                ingredients.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-yellow-500/30 bg-zinc-950/50 p-6">
              <h3 className="mb-2 text-xl font-semibold text-white">
                Is it suitable for beginners?
              </h3>
              <p className="leading-8 text-zinc-300">
                Yes. The ebook is written for home cooks and includes practical
                notes, timing guidance, and troubleshooting help.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-yellow-500/40 bg-zinc-950/60 p-8 text-center">
          <p className="mx-auto max-w-3xl leading-8 text-zinc-300">
            Whether you&apos;re making something for a festive table, an
            afternoon with chai, or a quiet dessert at home, I hope this little
            collection brings warmth and sweetness to your kitchen.
          </p>
        </section>
      </div>

    </main>
  );
}
