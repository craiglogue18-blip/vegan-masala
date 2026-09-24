import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meet Craig | Founder of Vegan Masala",
  description:
    "Meet Craig Logue, the Bristol-based founder and editor of Vegan Masala, and discover the story and values behind the recipes.",
  alternates: { canonical: "/about" },
};

const sectionClass =
  "rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm sm:p-10";

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/mandala-pattern.png')] bg-repeat opacity-[0.035]"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <header className="rounded-3xl border border-[var(--brand-gold)]/50 bg-[var(--surface)] px-7 py-12 text-center shadow-sm sm:px-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--brand-gold)]">
            The story behind Vegan Masala
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Meet Craig, the person behind Vegan Masala
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[var(--text-soft)]">
            I&apos;m Craig Logue, the founder and editor of Vegan Masala. I&apos;m
            originally from Wales and now live in Bristol, where this growing
            library of plant-based Indian food is researched, cooked and shared.
          </p>
        </header>

        <div className="mt-8 space-y-8">
          <section className={sectionClass}>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              My story
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              Where my love of Indian cooking began
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
              <p>
                I loved cooking from an early age. I would much rather learn a
                recipe and understand the techniques behind it than pay somebody
                else to cook for me. Growing up, an uncle introduced me to curry
                through recipes he had collected on his travels. Indian takeaways
                were a real treat in our family, so when money was tight I began
                researching my favourite dishes and experimenting with making them
                myself.
              </p>
              <p>
                Cooking at home gave me more control. I could adjust the heat,
                deepen the spices and shape every dish around my own taste. Then,
                one day, I discovered a Madhur Jaffrey cookbook on my grandparents&apos;
                shelf. It opened another door and I became a lifelong admirer of
                her cooking and her ability to make Indian food feel vivid,
                generous and achievable.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              Plant-based, without compromise
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              Becoming vegan without leaving my favourite food behind
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
              <p>
                I became vegetarian around ten years ago and fully vegan about
                eight years ago. Rather than giving up the curries I loved, I began
                adapting recipes that traditionally contained meat or dairy. I
                quickly realised how little flavour had to be sacrificed when the
                substitutions were chosen carefully and the cooking remained true
                to the character of the dish.
              </p>
              <p>
                Today there is an excellent range of plant-based ingredients, and
                in most recipes there is an effective alternative for meat, dairy,
                ghee or paneer. The result can still be rich, comforting and full
                of spice—with the important difference that no animal had to be
                harmed or exploited to put it on the table.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              Why the site exists
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              A library of the food I love
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
              <p>
                Vegan Masala began as a place to collect the recipes I had gathered
                over the years and adapted for plant-based cooking. I wanted curry
                lovers to know that they could make satisfying versions of their
                favourite dishes without compromising on flavour or relying on
                animal products.
              </p>
              <p>
                The site is for committed vegans, curious vegetarians and anybody
                who simply wants to eat more plant-based meals. As meat becomes
                more expensive and factory farming continues to affect animals and
                the environment, I hope to show non-vegans that a plant-based
                dinner can feel abundant rather than restrictive. This is not about
                lecturing people. It is about cooking food so enjoyable that the
                kinder choice becomes an easy one.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              Food, family and welcome
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              Indian food is more than a diet
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[var(--text-soft)]">
              <p>
                I have always been drawn not only to Indian food, but to the sense
                of family and hospitality that surrounds it. Food brings people
                together to celebrate, to offer charity, to welcome strangers and
                to turn an ordinary evening into something shared.
              </p>
              <p>
                To me, home cooking means recipes passed between grandparents,
                parents, children and grandchildren. It means people gathering
                around the table, talking and sharing their lives. That spirit of
                generosity is what I want Vegan Masala to carry into every kitchen
                it reaches.
              </p>
              <p>
                Friends would describe me as an enthusiastic and confident cook. I
                often arrive at a party with a pocket full of spices or something I
                have made, and I have been known to take over a friend&apos;s pots and
                pans to throw together a hearty meal for everyone. For me, cooking
                has always been one of the most natural ways to show care.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              What you&apos;ll find here
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              Practical help for confident home cooking
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                [
                  "Plant-based Indian recipes",
                  "Familiar curries, breads, sides and regional dishes adapted with thoughtful vegan alternatives.",
                ],
                [
                  "Useful cooking detail",
                  "Clear methods, visual and sensory cues, substitutions, storage advice and help when something goes wrong.",
                ],
                [
                  "Ingredient and technique guides",
                  "Approachable explanations of spices, equipment and methods that may be unfamiliar to Western home cooks.",
                ],
                [
                  "Honest editorial standards",
                  "Every page is reviewed for clarity and usefulness, and illustrative digital imagery is identified as such.",
                ],
              ].map(([title, copy]) => (
                <article
                  key={title}
                  className="rounded-2xl border border-[var(--border)] bg-black/15 p-6"
                >
                  <h3 className="text-lg font-bold text-[var(--brand-gold)]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-[var(--text-soft)]">
              Digital tools may assist with research, drafting, administration and
              illustrative food imagery, but they do not replace my editorial
              review. You can read more in the{" "}
              <Link
                href="/editorial-standards"
                className="font-semibold text-[var(--brand-gold)] underline"
              >
                Vegan Masala editorial standards
              </Link>
              .
            </p>
          </section>

          <section className="rounded-3xl border border-[var(--brand-gold)]/50 bg-[var(--surface)] p-7 text-center shadow-sm sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              The next chapter
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold text-white">
              More original cooking, more personality and more time in the kitchen
            </h2>
            <div className="mx-auto mt-6 max-w-3xl space-y-5 text-base leading-8 text-[var(--text-soft)]">
              <p>
                Building Vegan Masala has introduced me to a huge community of
                like-minded curry fans and to thousands of wonderful plant-based
                recipes. The next phase will bring more of me into the project:
                original cooking and method videos, preparation techniques,
                stories from Indian culinary heritage, and personal introductions
                to the spices and ingredients that make this food so rewarding.
              </p>
              <p>
                Vegan Masala is a project built from a genuine love of Indian home
                cooking and a desire to do my part to reduce animal exploitation
                while helping create a better planet for future generations.
              </p>
            </div>

            <p className="mt-8 text-2xl font-bold text-[var(--brand-gold)]">
              Vegan food, cooked with love.
            </p>
            <p className="mt-2 text-base text-white">— Craig Logue</p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/recipes"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Explore the recipes
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[var(--brand-gold)] transition hover:bg-white/5"
              >
                Get in touch with Craig
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
