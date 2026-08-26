import Link from "next/link";

const videos = [
  {
    slug: "aloo-baingan-recipe",
    title: "Aloo Baingan",
    caption: "Aubergine and potato become a deeply savoury curry.",
    video: "https://i1qzgzfvqbfdfc8e.public.blob.vercel-storage.com/videos/aloo-baingan-recipe.mp4",
  },
  {
    slug: "aloo-methi-potato-and-fenugreek-leaves-curry",
    title: "Aloo Methi",
    caption: "Watch potato and fenugreek come together with warming spices.",
    video: "https://i1qzgzfvqbfdfc8e.public.blob.vercel-storage.com/videos/aloo-methi-potato-and-fenugreek-leaves-curry.mp4",
  },
];

export default function RecipeVideoShowcase() {
  return (
    <section className="vm-rise mt-12 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg sm:p-8">
      <div className="grid items-center gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">From pan to plate</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-[var(--brand-gold)]">Watch it come together</h2>
          <p className="mt-4 max-w-xl leading-7 text-[var(--text-soft)]">A quick look inside the Vegan Masala kitchen. Watch the method, then open the complete recipe when you are ready to cook.</p>
          <Link href="/recipes" className="mt-6 inline-flex rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-95">Find more recipes</Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {videos.map((item) => (
            <Link key={item.slug} href={`/recipes/${item.slug}`} className="group relative overflow-hidden rounded-3xl border border-[var(--brand-gold)]/40 bg-black shadow-xl">
              <div className="relative aspect-[9/14] max-h-[480px]">
                <video src={item.video} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]" aria-label={`${item.title} recipe video`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-extrabold text-[var(--brand-gold)]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/80">{item.caption}</p>
                  <span className="mt-3 inline-block text-xs font-extrabold uppercase tracking-wide text-white">View full recipe →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
