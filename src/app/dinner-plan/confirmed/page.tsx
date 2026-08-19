import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Your 7-Day Dinner Plan is ready",
  description: "Confirmation and download page for the Vegan Masala 7-Day Dinner Plan.",
  robots: { index: false, follow: false },
};

const downloadUrl =
  process.env.NEXT_PUBLIC_DINNER_PLAN_DOWNLOAD_URL?.trim() ||
  "/downloads/vegan-masala-7-day-dinner-plan.pdf";

export default function DinnerPlanConfirmedPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-[var(--border)] bg-black/70 shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
        <div className="p-8 sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Email confirmed
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Your 7-Day Vegan Indian Dinner Plan is ready
          </h1>
          <p className="mt-6 text-lg leading-8 text-[var(--text-soft)]">
            Thank you for confirming your email. Your plan includes seven dinners,
            one organised shopping list and practical preparation notes.
          </p>

          <a
            href={downloadUrl}
            className="mt-8 inline-flex rounded-full bg-[var(--brand-gold)] px-7 py-4 text-base font-extrabold text-black transition hover:brightness-110"
            download="vegan-masala-7-day-dinner-plan.pdf"
          >
            Download the dinner plan
          </a>

          <p className="mt-6 text-sm leading-6 text-[var(--text-soft)]/80">
            You can bookmark this page. We only measure this confirmation when your
            advertising-cookie choice allows it.
          </p>
        </div>

        <div className="relative min-h-[320px] md:min-h-full">
          <Image
            src="/social/dinner-plan-launch/instagram-facebook-dinner-plan.png"
            alt="A selection of vegan Indian dishes from the seven-day dinner plan"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>
      </div>
    </main>
  );
}
