import Image from "next/image";
import Link from "next/link";

import CommerceLink from "@/components/CommerceLink";

const apronProductUrl = "https://payhip.com/b/R10eg";

export default function HomepageApronFeature() {
  return (
    <section className="vm-rise mt-12 overflow-hidden rounded-3xl border border-[var(--brand-gold)]/55 bg-[var(--surface)] shadow-lg">
      <div className="grid items-stretch lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[390px] overflow-hidden bg-[#f1ede3] sm:min-h-[500px] lg:min-h-full">
          <Image
            src="/images/store/vegan-masala-gold-apron-model.jpg"
            alt="Model wearing the black Vegan Masala apron with its single-colour gold embroidered logo"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-top"
          />
        </div>

        <div className="relative flex flex-col justify-center overflow-hidden p-7 sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url('/mandala-pattern.png')] bg-repeat opacity-[0.035]"
          />
          <div className="relative">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              New · Vegan Masala kitchenware
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Cook in the Vegan Masala apron
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
              A black organic-cotton apron finished with the Vegan Masala logo
              in single-colour gold embroidery. Adjustable, practical and made
              to order for cooks who take their masala seriously.
            </p>

            <ul className="mt-6 grid gap-3 text-sm text-[var(--text-soft)] sm:grid-cols-2">
              <li className="rounded-xl border border-[var(--border)] bg-black/15 px-4 py-3">
                Gold embroidered branding
              </li>
              <li className="rounded-xl border border-[var(--border)] bg-black/15 px-4 py-3">
                Organic cotton fabric
              </li>
              <li className="rounded-xl border border-[var(--border)] bg-black/15 px-4 py-3">
                Adjustable fit
              </li>
              <li className="rounded-xl border border-[var(--border)] bg-black/15 px-4 py-3">
                Made to order
              </li>
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <CommerceLink
                href={apronProductUrl}
                product="Vegan Masala Gold Embroidered Organic Cotton Apron"
                placement="homepage-apron-feature"
                value={29}
                className="inline-flex rounded-xl bg-[var(--brand-red)] px-6 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Shop the apron · £29
              </CommerceLink>
              <Link
                href="/store"
                className="inline-flex rounded-xl border border-[var(--brand-gold)] px-6 py-3 font-extrabold text-[var(--brand-gold)] transition hover:bg-white/5"
              >
                Explore the shop
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]/80">
              Produced to order by our fulfilment partner. Delivery is calculated at checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
