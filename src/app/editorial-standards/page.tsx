import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Standards",
  description:
    "How Vegan Masala develops, reviews, corrects and illustrates its vegan Indian recipes and cooking guides.",
};

export default function EditorialStandardsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
          Trust and transparency
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)]">
          Editorial standards
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--text-soft)]">
          Vegan Masala exists to help home cooks make flavourful vegan Indian food
          with clear methods and realistic ingredients. Craig Logue is responsible
          for selecting, editing and maintaining the content on this site.
        </p>

        <div className="mt-9 space-y-8 text-[var(--text-soft)]">
          <section>
            <h2 className="text-xl font-bold text-[var(--brand-gold)]">Recipe development and review</h2>
            <p className="mt-3 leading-7">
              Recipes are adapted for a fully vegan kitchen and edited so quantities,
              timings and instructions are internally consistent. Each page aims to
              explain useful sensory cues, substitutions, serving ideas and likely
              trouble spots—not merely reproduce an ingredient list.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--brand-gold)]">Use of digital and AI tools</h2>
            <p className="mt-3 leading-7">
              Digital tools may assist with research, early drafts, site maintenance
              and illustrations. Craig reviews and edits material before publication.
              Some food images are AI-generated illustrations and should not be read
              as documentary photographs of the finished recipe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--brand-gold)]">Recommendations and affiliate links</h2>
            <p className="mt-3 leading-7">
              Equipment suggestions explain why an item may be useful in the context
              of a recipe or technique. Affiliate links are labelled, and a purchase
              may earn Vegan Masala a commission at no extra cost to the reader.
              Commercial relationships do not determine the cooking advice provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--brand-gold)]">Corrections</h2>
            <p className="mt-3 leading-7">
              If a measurement, method or factual statement appears wrong or unclear,
              please <Link href="/contact" className="font-semibold text-[var(--brand-gold)] underline">contact us</Link>.
              Substantive corrections are made directly on the affected page.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
