import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import CommerceLink from "@/components/CommerceLink";
import StoreProductNavigation, { StoreBreadcrumb } from "@/components/StoreProductNavigation";

const PAYHIP_URL = process.env.NEXT_PUBLIC_BREAD_MASTERCLASS_PAYHIP_URL?.trim() || "https://payhip.com/b/AzHZq";

export const metadata: Metadata = {
  title: "Indian Bread Masterclass Pack | Vegan Masala",
  description: "An expanded 18-page Indian vegan bread masterclass with dough ratios, filled breads, batch planning, pairings and a printable practice log.",
  alternates: { canonical: "/store/indian-bread-masterclass" },
};

const additions = [
  "Dough ratio cards for chapati, paratha, naan and poori",
  "Three practical savoury filling formulas",
  "A complete batch-cooking schedule",
  "Bread-and-curry pairing guidance",
  "An illustrated tandoor and home-oven technique guide",
  "A printable bread practice log",
];

export default function IndianBreadMasterclassPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-16">
      <StoreBreadcrumb current="Indian Bread Masterclass" />
      <section className="grid overflow-hidden rounded-[2rem] border border-[var(--brand-gold)]/45 bg-black/70 shadow-2xl lg:grid-cols-[1.02fr_0.98fr]">
        <div className="p-7 sm:p-10 lg:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Expanded 18-page edition</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-6xl">Indian Bread Masterclass Pack</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-soft)]">Move beyond individual recipes and learn the repeatable decisions behind softer chapati, properly blistered naan, filled paratha and puffed poori.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {PAYHIP_URL ? (
              <CommerceLink href={PAYHIP_URL} product="Indian Bread Masterclass Pack" placement="bread-masterclass-hero" value={9} className="inline-flex rounded-full bg-[var(--brand-red)] px-7 py-4 font-extrabold text-white transition hover:-translate-y-0.5 hover:brightness-110">Buy the pack for £9</CommerceLink>
            ) : (
              <span className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/10 px-7 py-4 font-extrabold text-amber-200">Payhip release being prepared</span>
            )}
            <Link href="/bread-guide" className="inline-flex rounded-full border border-[var(--brand-gold)] px-7 py-4 font-extrabold text-[var(--brand-gold)] hover:bg-[var(--brand-gold)] hover:text-black">Start with the free guide</Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--text-soft)]/75">One payment. Instant PDF delivery through Payhip. The free guide remains available for anyone who does not need the expanded workbook.</p>
        </div>
        <div className="relative flex min-h-[500px] items-center justify-center border-t border-[var(--border)] bg-[radial-gradient(circle_at_top,#254044_0%,#071719_62%,#020607_100%)] p-10 lg:border-l lg:border-t-0">
          <Image src="/images/store/indian-bread-masterclass-cover.jpg" alt="Cover of the Indian Bread Masterclass Pack" width={900} height={1272} priority sizes="(min-width: 1024px) 38vw, 75vw" className="max-h-[560px] w-auto rounded-lg border border-[var(--brand-gold)]/60 object-contain shadow-2xl" />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">What the paid pack adds</p><h2 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">Turn the free introduction into repeatable skill</h2></div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{additions.map((item) => <article key={item} className="rounded-2xl border border-[var(--brand-gold)]/30 bg-black/50 p-5 font-bold leading-7 text-white"><span className="mr-2 text-[var(--brand-gold)]">✓</span>{item}</article>)}</div>
      </section>

      <section className="rounded-[2rem] border border-[var(--brand-gold)]/35 bg-gradient-to-br from-[var(--brand-red)]/15 via-black/70 to-black/70 p-7 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div><h2 className="text-3xl font-extrabold text-[var(--brand-gold)]">Designed for actual practice</h2><p className="mt-4 leading-8 text-[var(--text-soft)]">The ratio cards give you a reliable starting range, while the practice log helps you record flour, hydration, rest, heat and the one adjustment to make next time. That is how a recipe becomes judgement you can reuse.</p></div>
          <div><h2 className="text-3xl font-extrabold text-[var(--brand-gold)]">Transparent recommendations</h2><p className="mt-4 leading-8 text-[var(--text-soft)]">The equipment section explains what a tawa, slim rolling pin and metal tongs contribute before linking to optional products. Those links are clearly disclosed affiliates and never change the price you pay.</p></div>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-[var(--brand-gold)]/30 bg-black/50 p-7 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Inside the PDF</p><h2 className="mt-3 text-3xl font-extrabold text-white">A practical 18-page workbook</h2><p className="mt-4 leading-8 text-[var(--text-soft)]">The pack combines concise technique explanations with ratios, filling formulas, batch planning and space to record what changed from one bake to the next.</p></div>
          <ul className="grid gap-3 text-zinc-200 sm:grid-cols-2"><li className="rounded-xl border border-white/10 p-4">Chapati ratio card</li><li className="rounded-xl border border-white/10 p-4">Naan and oven guidance</li><li className="rounded-xl border border-white/10 p-4">Filled paratha formulas</li><li className="rounded-xl border border-white/10 p-4">Printable practice log</li></ul>
        </div>
      </section>

      <section className="mt-10"><h2 className="text-3xl font-extrabold text-white">Questions before you buy</h2><div className="mt-6 grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-[var(--border)] bg-black/45 p-6"><h3 className="text-xl font-extrabold text-[var(--brand-gold)]">Is this suitable for beginners?</h3><p className="mt-3 leading-7 text-zinc-300">Yes. It starts with reliable ratios and explains the visual and tactile cues that recipes often leave out.</p></article><article className="rounded-2xl border border-[var(--border)] bg-black/45 p-6"><h3 className="text-xl font-extrabold text-[var(--brand-gold)]">How is it delivered?</h3><p className="mt-3 leading-7 text-zinc-300">You receive an instant PDF download through Payhip after your one-time purchase.</p></article></div></section>

      <StoreProductNavigation currentSlug="indian-bread-masterclass" />
    </main>
  );
}
