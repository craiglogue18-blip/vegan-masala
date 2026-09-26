"use client";

export default function FilmingPackPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-extrabold text-white hover:brightness-110"
    >
      Print or save as PDF
    </button>
  );
}
