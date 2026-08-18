import Image from "next/image";

type DinnerPlanPromoProps = {
  placement: "homepage" | "recipe";
  compact?: boolean;
};

const landingPage = "https://vegan-masala.kit.com/7271084c33";

export default function DinnerPlanPromo({ placement, compact = false }: DinnerPlanPromoProps) {
  const href = `${landingPage}?utm_source=vegan-masala&utm_medium=website&utm_campaign=7-day-dinner-plan&utm_content=${placement}`;

  return (
    <aside
      aria-labelledby={`dinner-plan-${placement}`}
      className={`relative overflow-hidden rounded-3xl border border-[var(--brand-gold)]/45 bg-[var(--surface)] shadow-lg ${
        compact ? "p-6" : "p-6 sm:p-8"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--brand-red)]/15 via-transparent to-[var(--brand-gold)]/10" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_220px]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/75">
            Free from the Vegan Masala kitchen
          </p>
          <h2
            id={`dinner-plan-${placement}`}
            className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)] sm:text-3xl"
          >
            Make dinner the easy decision this week
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-[var(--text-soft)]">
            Get seven flavour-packed vegan Indian dinners, one organised shopping list and
            practical preparation notes delivered straight to your inbox.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[var(--text-soft)]">
            <span>✓ Seven complete dinner ideas</span>
            <span>✓ One combined shopping list</span>
            <span>✓ Free instant PDF download</span>
          </div>
          <a
            href={href}
            className="mt-6 inline-flex rounded-xl bg-[var(--brand-red)] px-6 py-3 font-extrabold text-white shadow transition hover:-translate-y-0.5 hover:opacity-95"
          >
            Get the free 7-day plan
          </a>
          <p className="mt-3 text-xs text-[var(--text-soft)]/70">
            Occasional cooking inspiration. Unsubscribe at any time.
          </p>
        </div>

        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--brand-gold)]/60 md:block">
          <Image
            src="/images/recipes/veg-biryani-vegetable-biryani-recipe.png"
            alt="Vegetable biryani from the free Vegan Masala dinner plan"
            fill
            sizes="220px"
            className="object-cover"
          />
        </div>
      </div>
    </aside>
  );
}
