import Image from "next/image";
import Link from "next/link";

const base = "/social/week-2026-09-21";

const videos = [
  {
    href: "/bread-guide",
    title: "The moment a roti puffs",
    caption: "See how even rolling and steady heat create that satisfying puff.",
    video: `${base}/monday-roti.mp4`,
    poster: `${base}/monday-roti-cover.png`,
  },
  {
    href: "/recipes/vegetable-balti",
    title: "Do not rush the onions",
    caption: "Build sweetness and body before the rest of the curry goes in.",
    video: `${base}/tuesday-balti.mp4`,
    poster: `${base}/tuesday-balti-cover.png`,
  },
  {
    href: "/recipes/aloo-muttar",
    title: "Potatoes first. Peas later.",
    caption: "A small timing decision that gives both vegetables the right texture.",
    video: `${base}/thursday-aloo-matar.mp4`,
    poster: `${base}/thursday-aloo-matar-cover.png`,
  },
  {
    href: "/recipes/the-best-jackfruit-curry",
    title: "Make jackfruit hold the masala",
    caption: "Cook until the sauce clings to the fibres instead of pooling below.",
    video: `${base}/saturday-jackfruit.mp4`,
    poster: `${base}/saturday-jackfruit-cover.png`,
  },
];

export default function RecipeVideoShowcase() {
  const [featured, ...moreVideos] = videos;

  return (
    <section className="vm-rise mt-12 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">
            Practical cooking moments
          </p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight text-[var(--brand-gold)]">
            Watch the technique, then cook the recipe
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-[var(--text-soft)]">
            Short, useful demonstrations from our latest social series—each one
            linked to the complete recipe or guide.
          </p>
        </div>
        <Link
          href="/recipes"
          className="inline-flex w-fit rounded-xl border border-[var(--brand-gold)] px-5 py-3 text-sm font-extrabold text-[var(--brand-gold)] transition hover:bg-white/5"
        >
          Browse all recipes
        </Link>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Link
          href={featured.href}
          className="group overflow-hidden rounded-3xl border border-[var(--brand-gold)]/45 bg-black/30 shadow-xl"
        >
          <div className="grid sm:grid-cols-[minmax(220px,0.78fr)_1fr] sm:items-stretch">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden bg-black sm:max-w-none">
              <video
                src={featured.video}
                poster={featured.poster}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                className="h-full w-full object-contain"
                aria-label={`${featured.title} cooking video`}
              />
            </div>
            <div className="flex flex-col justify-center border-t border-[var(--brand-gold)]/30 p-6 sm:border-l sm:border-t-0 sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">
                Featured technique
              </p>
              <h3 className="mt-3 text-2xl font-extrabold leading-tight text-[var(--brand-gold)]">
                {featured.title}
              </h3>
              <p className="mt-3 leading-7 text-white/85">{featured.caption}</p>
              <span className="mt-4 inline-block text-sm font-extrabold text-white">
                Open the complete guide →
              </span>
            </div>
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {moreVideos.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group grid overflow-hidden rounded-2xl border border-[var(--border)] bg-black/20 sm:block lg:grid lg:grid-cols-[150px_1fr]"
            >
              <div className="relative min-h-40 overflow-hidden sm:aspect-[4/5] lg:aspect-auto lg:min-h-44">
                <Image
                  src={item.poster}
                  alt={`${item.title} video cover`}
                  fill
                  sizes="(max-width: 1024px) 33vw, 150px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-red)] text-sm text-white shadow">
                  ▶
                </span>
              </div>
              <div className="flex flex-col justify-center p-4">
                <h3 className="font-extrabold leading-snug text-[var(--brand-gold)] group-hover:underline">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {item.caption}
                </p>
                <span className="mt-3 text-xs font-extrabold uppercase tracking-wide text-white/80">
                  Watch and cook →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
