import Image from "next/image";
import Link from "next/link";

const products = [
  {
    slug: "vegan-indian-sweets",
    href: "/store/vegan-indian-sweets",
    title: "Vegan Indian Sweets",
    description: "Six celebration recipes with pantry notes and troubleshooting help.",
    price: "£5",
    image: "/images/ebook/cover.jpg",
  },
  {
    slug: "indian-bread-masterclass",
    href: "/store/indian-bread-masterclass",
    title: "Indian Bread Masterclass",
    description: "Dough ratios, four breads, fillings, batch planning and a practice log.",
    price: "£9",
    image: "/images/store/indian-bread-masterclass-cover.jpg",
  },
  {
    slug: "curry-base-masterclass",
    href: "/store/curry-base-masterclass",
    title: "Curry Base Masterclass",
    description: "Read every cooking stage, adapt one base and fix common problems.",
    price: "£11",
    image: "/images/store/curry-base-masterclass-cover.jpg",
  },
];

export function StoreBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-soft)]">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/store" className="font-bold text-[var(--brand-gold)] hover:underline">Store</Link></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}

export default function StoreProductNavigation({ currentSlug }: { currentSlug: string }) {
  const related = products.filter((product) => product.slug !== currentSlug);

  return (
    <section className="mt-16 border-t border-[var(--border)] pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Keep exploring</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">More from the Vegan Masala store</h2>
        </div>
        <Link href="/store" className="font-extrabold text-[var(--brand-gold)] hover:underline">← Back to the store</Link>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {related.map((product) => (
          <Link key={product.slug} href={product.href} className="group grid grid-cols-[110px_1fr] overflow-hidden rounded-2xl border border-[var(--brand-gold)]/30 bg-black/55 transition hover:-translate-y-1 hover:border-[var(--brand-gold)]">
            <div className="relative min-h-40 bg-[#071719] p-3">
              <Image src={product.image} alt="" fill sizes="110px" className="object-contain p-3 transition duration-300 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-extrabold text-white">{product.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{product.description}</p>
              <p className="mt-3 font-extrabold text-[var(--brand-gold)]">{product.price} · View details →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
