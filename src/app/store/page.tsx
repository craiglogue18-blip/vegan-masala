import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import CommerceLink from "@/components/CommerceLink";
import PageIdentityLabel from "@/components/PageIdentityLabel";

const APRON_PRODUCT_URL = "https://payhip.com/b/R10eg";

export const metadata: Metadata = {
  title: "Vegan Masala Store | Indian Cooking Guides & Kitchenware",
  description: "Shop practical Vegan Masala ebooks, Indian cooking masterclasses and branded kitchenware, with secure checkout and instant PDF delivery.",
  alternates: { canonical: "/store" },
};

const guides = [
  {
    href: "/store/vegan-indian-sweets",
    title: "Vegan Indian Sweets",
    description: "Six celebration recipes with pantry notes, troubleshooting and a beautifully illustrated 23-page design.",
    meta: "Digital PDF · 23 pages · Beginner friendly",
    price: "£5",
    image: "/images/ebook/cover.jpg",
  },
  {
    href: "/store/indian-bread-masterclass",
    title: "Indian Bread Masterclass",
    description: "Learn repeatable dough decisions for chapati, naan, paratha and poori, with fillings and a practice log.",
    meta: "Digital PDF · 18 pages · Practical workbook",
    price: "£9",
    image: "/images/store/indian-bread-masterclass-cover.jpg",
  },
  {
    href: "/store/curry-base-masterclass",
    title: "Curry Base Masterclass",
    description: "Build, read and adapt a dependable masala base using visual, aroma and texture cues.",
    meta: "Digital PDF · 20 pages · Four adaptable dinners",
    price: "£11",
    image: "/images/store/curry-base-masterclass-cover.jpg",
  },
];

export default function StorePage() {
  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8 lg:px-10">
        <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
          <h1 className="sr-only">Vegan Masala Store</h1>
          <PageIdentityLabel>Vegan Masala Store</PageIdentityLabel>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[var(--text-soft)]">Practical guides and thoughtful kitchenware for cooks who want to understand the technique—not just follow a timer.</p>
        </section>

        <section className="mt-12" aria-labelledby="digital-guides-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Learn at your own pace</p>
            <h2 id="digital-guides-heading" className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Digital guides and masterclasses</h2>
            <p className="mt-3 leading-7 text-[var(--text-soft)]">Open any guide to see exactly what is included, preview the content and decide whether it is right for you.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="group flex overflow-hidden rounded-[1.5rem] border border-[var(--brand-gold)]/35 bg-black/65 transition hover:-translate-y-1 hover:border-[var(--brand-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-gold)] md:flex-col">
                <div className="relative flex min-h-64 w-2/5 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#254044_0%,#071719_62%,#020607_100%)] p-5 md:aspect-[4/5] md:w-full">
                  <Image src={guide.image} alt={`Cover of ${guide.title}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 40vw" className="object-contain p-5 transition duration-500 group-hover:scale-[1.035]" />
                  <span className="absolute left-3 top-3 rounded-full bg-[var(--brand-red)] px-3 py-1 text-xs font-extrabold text-white">AVAILABLE NOW</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-2xl font-extrabold text-white">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{guide.description}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-400">{guide.meta}</p>
                  <p className="mt-auto pt-5 text-lg font-extrabold text-[var(--brand-gold)]">{guide.price} · View details →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-[2rem] border border-[var(--brand-gold)]/35 bg-black/65">
            <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-72"><Image src="/images/store/vegan-masala-gold-apron-model.jpg" alt="Black organic cotton Vegan Masala apron embroidered in gold" fill sizes="(min-width: 1024px) 25vw, 100vw" className="object-cover" /></div>
              <div className="flex flex-col justify-center p-7">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Kitchenware · Made to order</p>
                <h2 className="mt-3 text-3xl font-extrabold">Gold Embroidered Apron</h2>
                <p className="mt-3 leading-7 text-zinc-300">Organic cotton, adjustable fit and a practical two-compartment pocket.</p>
                <CommerceLink href={APRON_PRODUCT_URL} product="Vegan Masala Gold Embroidered Organic Cotton Apron" placement="store-kitchenware" value={29} className="mt-6 inline-flex w-fit rounded-full bg-[var(--brand-red)] px-6 py-3 font-extrabold text-white">Shop the apron · £29</CommerceLink>
              </div>
            </div>
          </article>

          <Link href="/bread-guide" className="group overflow-hidden rounded-[2rem] border border-emerald-400/35 bg-black/65 transition hover:-translate-y-1 hover:border-emerald-400">
            <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative flex min-h-72 items-center justify-center bg-[#071719] p-6"><Image src="/images/store/indian-bread-starter-guide-cover.jpg" alt="Cover of the free Authentic Indian Vegan Breads starter guide" fill sizes="(min-width: 1024px) 25vw, 100vw" className="object-contain p-6 transition duration-300 group-hover:scale-105" /></div>
              <div className="flex flex-col justify-center p-7">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-300">Free resource</p>
                <h2 className="mt-3 text-3xl font-extrabold">Indian Bread Starter Guide</h2>
                <p className="mt-3 leading-7 text-zinc-300">A free introduction to bread culture, ovens, core techniques and traditions for newsletter readers.</p>
                <p className="mt-6 font-extrabold text-emerald-300">Get the free guide →</p>
              </div>
            </div>
          </Link>
        </section>

        <section className="mt-14 grid gap-4 rounded-[2rem] border border-[var(--brand-gold)]/30 bg-[var(--surface)] p-7 text-center sm:grid-cols-3">
          <div><p className="text-2xl" aria-hidden="true">✓</p><h2 className="mt-2 font-extrabold">Secure checkout</h2><p className="mt-1 text-sm text-[var(--text-soft)]">Payments are handled securely by Payhip.</p></div>
          <div><p className="text-2xl" aria-hidden="true">↓</p><h2 className="mt-2 font-extrabold">Instant PDF delivery</h2><p className="mt-1 text-sm text-[var(--text-soft)]">Download links arrive after purchase.</p></div>
          <div><p className="text-2xl" aria-hidden="true">♥</p><h2 className="mt-2 font-extrabold">Made for real kitchens</h2><p className="mt-1 text-sm text-[var(--text-soft)]">Clear guidance, practical cues and vegan recipes.</p></div>
        </section>

        <section className="mt-14" aria-labelledby="store-faq-heading">
          <h2 id="store-faq-heading" className="text-3xl font-extrabold">Store questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[var(--border)] bg-black/45 p-6"><h3 className="text-xl font-extrabold text-[var(--brand-gold)]">How are digital guides delivered?</h3><p className="mt-3 leading-7 text-zinc-300">Payhip provides an instant PDF download after purchase and sends the link to your email.</p></article>
            <article className="rounded-2xl border border-[var(--border)] bg-black/45 p-6"><h3 className="text-xl font-extrabold text-[var(--brand-gold)]">Can I read them on a phone or tablet?</h3><p className="mt-3 leading-7 text-zinc-300">Yes. Every paid guide is supplied as a PDF that you can keep, read digitally or print for personal use.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
