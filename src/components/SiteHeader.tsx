import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <>
      <header className="border-b border-[var(--border)] bg-[#07131d]">
        <Link
          href="/"
          aria-label="Vegan Masala home"
          className="relative mx-auto flex h-[200px] max-w-[3000px] items-center justify-center overflow-hidden sm:h-[280px] lg:h-[320px]"
        >
          <Image
            src="/images/header/vegan-masala-header-background.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#07131d]/20 to-transparent" />

          <div className="relative flex flex-col items-center px-20 text-center drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] sm:px-32">
            <Image
              src="/brand/logo-primary.png"
              alt="Vegan Masala"
              width={454}
              height={398}
              priority
              className="h-auto w-[145px] sm:w-[205px] lg:w-[230px]"
            />
            <p className="-mt-1 whitespace-nowrap text-[11px] font-semibold tracking-wide text-white sm:text-base lg:text-lg">
              Plant-based Indian recipes, made authentically
            </p>
            <p className="mt-1 text-xs font-bold tracking-wide text-[var(--brand-gold)] sm:text-base">
              vegan-masala.com
            </p>
            <p className="text-[10px] font-medium tracking-wide text-white/90 sm:text-sm">
              information@vegan-masala.com
            </p>
          </div>
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
            <Link className="hover:opacity-90" href="/meal-planner">
              Meal Planner
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
              href="/dinner-plan?utm_source=vegan-masala&utm_medium=website&utm_campaign=7-day-dinner-plan&utm_content=header"
              className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white shadow transition hover:-translate-y-0.5 hover:opacity-95 sm:text-base"
            >
              Free Dinner Plan
            </a>
        </div>
      </nav>
    </>
  );
}
