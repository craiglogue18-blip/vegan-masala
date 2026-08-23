import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <>
      <header className="border-b border-[var(--border)] bg-[#07131d]">
        <Link
          href="/"
          aria-label="Vegan Masala home"
          className="mx-auto block max-w-[1200px]"
        >
          <Image
            src="/images/header/vegan-masala-site-header.png"
            alt="Vegan Masala — Plant-based Indian recipes, made authentically"
            width={2048}
            height={768}
            priority
            sizes="100vw"
            className="min-h-[150px] w-full object-cover object-center sm:min-h-0"
          />
        </Link>
      </header>

      <nav
        aria-label="Main navigation"
        className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#0b151c]/95 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[17px] font-bold tracking-wide text-[var(--brand-gold)] sm:gap-x-8 sm:text-[20px]">
            <Link className="hover:opacity-90" href="/recipes">
              Recipes
            </Link>
            <Link className="hover:opacity-90" href="/guides">
              Guides
            </Link>
            <Link className="hover:opacity-90" href="/store">
              Store
            </Link>
            <Link className="hover:opacity-90" href="/about">
              About
            </Link>
            <Link className="hover:opacity-90" href="/contact">
              Contact
            </Link>
            <a
              href="https://vegan-masala.kit.com/7271084c33?utm_source=vegan-masala&utm_medium=website&utm_campaign=7-day-dinner-plan&utm_content=header"
              className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white shadow transition hover:-translate-y-0.5 hover:opacity-95 sm:text-base"
            >
              Free Dinner Plan
            </a>
        </div>
      </nav>
    </>
  );
}
