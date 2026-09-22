import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import CommerceLink from "@/components/CommerceLink";

const PAYHIP_URL =
  process.env.NEXT_PUBLIC_CURRY_MASTERCLASS_PAYHIP_URL?.trim() ||
  "https://payhip.com/b/rQ3ap";

export const metadata: Metadata = {
  title: "Curry Base Masterclass | Vegan Masala",
  description:
    "A visual 20-page masterclass for building, reading and adapting a dependable vegan Indian masala base.",
  alternates: { canonical: "/store/curry-base-masterclass" },
};

const lessons = [
  "A seven-stage master flow with visual, aroma and texture cues",
  "A measured master masala recipe for four generous portions",
  "Four adaptable paths: chana, tofu, vegetable curry and dal",
  "Spice timing patterns for blooming, simmering and finishing",
  "Batch-cooking, chilling and freezing guidance",
  "Troubleshooting and a printable practice log",
];

export default function CurryBaseMasterclassPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-16">
      <section className="grid overflow-hidden rounded-[2rem] border border-[var(--brand-gold)]/45 bg-black/70 shadow-2xl lg:grid-cols-[1.02fr_0.98fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            New 20-page practical edition
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Curry Base Masterclass
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
            Stop guessing when the onions, tomato or spices are ready. Learn the repeatable decisions behind a deep, balanced masala base and turn it into four different dinners.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {PAYHIP_URL ? (
              <CommerceLink
                href={PAYHIP_URL}
                product="Curry Base Masterclass"
                placement="curry-masterclass-hero"
                value={11}
                className="inline-flex rounded-full bg-[var(--brand-red)] px-7 py-4 font-extrabold text-white transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Buy the masterclass for £11
              </CommerceLink>
            ) : (
              <span className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/10 px-7 py-4 font-extrabold text-amber-200">
                Payhip release being prepared
              </span>
            )}
            <Link
              href="/guides/how-to-build-a-curry-base"
              className="inline-flex rounded-full border border-[var(--brand-gold)] px-7 py-4 font-extrabold text-[var(--brand-gold)] transition hover:bg-[var(--brand-gold)] hover:text-black"
            >
              Read the free guide
            </Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--text-soft)]/75">
            One payment. Instant PDF delivery through Payhip. The free guide remains available for cooks who do not need the full workbook.
          </p>
        </div>

        <div className="relative min-h-[500px] border-t border-[var(--border)] lg:border-l lg:border-t-0">
          <Image
            src="/images/guides/how-to-build-a-curry-base.png"
            alt="A cook building an Indian curry base in a pan"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10" />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-[var(--brand-gold)]/45 bg-black/85 p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]">
              Cook · notice · adjust
            </p>
            <p className="mt-2 text-white">A visual learning system designed to turn recipes into judgement you can reuse.</p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Inside the masterclass</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">Know what ready looks, sounds and smells like</h2>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <article key={lesson} className="rounded-2xl border border-[var(--brand-gold)]/30 bg-black/50 p-5 font-bold leading-7 text-white">
              <span className="mr-2 text-[var(--brand-gold)]">✓</span>
              {lesson}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          ["Build", "Follow one master masala from hot fat through reduced tomato and protected ground spices."],
          ["Read", "Use colour, texture, sound, aroma and oil separation as evidence instead of relying only on a timer."],
          ["Adapt", "Turn the same foundation into chickpea, tofu, seasonal vegetable or lentil dinners without making them taste identical."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-[1.75rem] border border-[var(--brand-gold)]/35 bg-[var(--surface)] p-7">
            <h2 className="text-3xl font-extrabold text-[var(--brand-gold)]">{title}</h2>
            <p className="mt-4 leading-8 text-[var(--text-soft)]">{copy}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-[2rem] border border-[var(--brand-gold)]/35 bg-gradient-to-br from-[var(--brand-red)]/15 via-black/70 to-black/70 p-7 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-[var(--brand-gold)]">Grounded in real home cooking</h2>
            <p className="mt-4 leading-8 text-[var(--text-soft)]">The guide treats a curry base as a flexible method, not a claim that every Indian curry follows one formula. Regional, family and dish-specific techniques remain distinct.</p>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[var(--brand-gold)]">Useful recommendations, clearly disclosed</h2>
            <p className="mt-4 leading-8 text-[var(--text-soft)]">Optional equipment recommendations explain the problem each tool solves before linking to any affiliate product. Technique matters more than brand.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
