export default function FilmingPackPrintButton() {
  return (
    <a
      href="/api/admin/social/production/filming-pack/pdf"
      download="vegan-masala-first-10-filming-pack.pdf"
      className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-extrabold text-white hover:brightness-110"
    >
      Download filming pack PDF
    </a>
  );
}
