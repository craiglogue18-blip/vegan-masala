"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Campaign = { id: string; label: string; description: string; source: "none" | "recipe" | "recipe-or-guide" };
type Source = { slug: string; title?: string; label?: string; type?: string };
type Result = {
  ok?: boolean; error?: string; image?: string; publishImage?: string; video?: string;
  copy?: { title?: string; hook?: string; caption?: string; captionVariants?: string[]; destinationUrl?: string; disclosure?: string };
};

async function json(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { ok: false, error: text || "Invalid response" }; }
}
export default function CampaignStudioPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [kind, setKind] = useState("affiliate");
  const [format, setFormat] = useState<"story" | "video">("story");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/social/campaigns", { cache: "no-store" }).then(json),
      fetch("/api/admin/social/slugs", { cache: "no-store" }).then(json),
    ]).then(([campaignData, sourceData]) => {
      const nextCampaigns = Array.isArray(campaignData?.campaigns) ? campaignData.campaigns : [];
      const nextSources = (Array.isArray(sourceData?.slugs) ? sourceData.slugs : []).map((item: any) =>
        typeof item === "string" ? { slug: item, title: item, type: "recipe" } : item
      );
      setCampaigns(nextCampaigns);
      setSources(nextSources);
      const firstRecipe = nextSources.find((item: Source) => item.type !== "guide");
      if (firstRecipe) setSlug(firstRecipe.slug);
    }).catch(() => setStatus("Could not load campaign choices."));
  }, []);

  const selected = campaigns.find((item) => item.id === kind);
  const availableSources = useMemo(() => {
    if (selected?.source === "recipe") return sources.filter((item) => item.type !== "guide");
    return sources;
  }, [selected, sources]);

  useEffect(() => {
    if (selected?.source !== "none" && !availableSources.some((item) => item.slug === slug)) {
      setSlug(availableSources[0]?.slug || "");
    }
  }, [availableSources, selected, slug]);

  const captions = result?.copy?.captionVariants?.length
    ? result.copy.captionVariants
    : result?.copy?.caption ? [result.copy.caption] : [];

  async function generate() {
    setLoading(true); setStatus(format === "video" ? "Building a 12-second campaign video…" : "Building story artwork…"); setResult(null); setCaptionIndex(0);
    try {
      const response = await fetch("/api/admin/social/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, format, slug: selected?.source === "none" ? "" : slug }),
      });
      const data = await json(response) as Result;
      if (!response.ok || !data.ok) throw new Error(data.error || "Generation failed");
      setResult(data); setStatus("Campaign generated and checked. Nothing has been queued or published.");
    } catch (error: any) { setStatus(error?.message || "Generation failed"); }
    finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">Admin · Campaign Studio</div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">Stories, campaigns and affiliate video</h1>
            <p className="mt-3 max-w-3xl text-[var(--text-soft)]">Create useful, varied social content grounded in Vegan Masala recipes, guides and site tools. This studio only generates previews—it never adds anything to the queue automatically.</p>
          </div>
          <Link href="/admin/social" className="rounded-xl border border-[var(--border)] px-5 py-3 font-bold text-[var(--brand-gold)]">Back to admin hub</Link>
        </div>
      </section>

      <div className="mt-8 grid gap-7 lg:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
          <label className="text-sm font-bold text-[var(--brand-gold)]">Campaign angle</label>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white">
            {campaigns.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{selected?.description}</p>

          {selected?.source !== "none" ? <div className="mt-6">
            <label className="text-sm font-bold text-[var(--brand-gold)]">Source material</label>
            <select value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white">
              {availableSources.map((item) => <option key={`${item.type}-${item.slug}`} value={item.slug}>{item.title || item.label || item.slug}{item.type === "guide" ? " · Guide" : ""}</option>)}
            </select>
            <p className="mt-2 text-xs text-[var(--text-soft)]">Claims, imagery and tips are taken from this page.</p>
          </div> : null}

          <div className="mt-6">
            <div className="text-sm font-bold text-[var(--brand-gold)]">Delivery format</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button onClick={() => setFormat("story")} className={`rounded-xl border px-4 py-3 font-bold ${format === "story" ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] text-white"}`}>Story · 9:16</button>
              <button onClick={() => setFormat("video")} className={`rounded-xl border px-4 py-3 font-bold ${format === "video" ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] text-white"}`}>Video · 12 sec</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">This chooses a still Story or an animated version of the same card. It does not create a carousel or a new Recraft cooking scene.</p>
          </div>

          <button disabled={loading || !selected || (selected.source !== "none" && !slug)} onClick={generate} className="mt-7 w-full rounded-xl bg-[var(--brand-red)] px-5 py-4 font-extrabold text-white disabled:opacity-50">{loading ? "Generating…" : `Generate ${format}`}</button>
          {status ? <div className="mt-4 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm leading-6 text-[var(--text-soft)]">{status}</div> : null}
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Preview</h2>
          {!result ? <div className="mt-5 flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-black/20 p-8 text-center text-[var(--text-soft)]">Choose an angle and generate a preview.</div> : <div className="mt-5 grid gap-7 xl:grid-cols-[minmax(300px,480px)_1fr]">
            <div>
              {format === "video" && result.video ? <video controls playsInline src={result.video} className="max-h-[760px] w-full rounded-2xl bg-black object-contain" /> : <img src={result.image} alt={result.copy?.title || "Generated campaign"} className="max-h-[760px] w-full rounded-2xl bg-black object-contain" />}
              <div className="mt-3 flex flex-wrap gap-3">
                <a href={result.image} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-gold)]">Open story image</a>
                {result.video ? <a href={result.video} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-gold)]">Open video</a> : null}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Caption options</div>
              {captions.length > 1 ? <div className="mt-3 flex flex-wrap gap-2">{captions.map((_, index) => <button key={index} onClick={() => setCaptionIndex(index)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${captionIndex === index ? "border-[var(--brand-gold)] text-[var(--brand-gold)]" : "border-[var(--border)] text-[var(--text-soft)]"}`}>Option {index + 1}</button>)}</div> : null}
              <textarea readOnly value={captions[captionIndex] || ""} className="mt-3 min-h-[330px] w-full rounded-2xl border border-[var(--border)] bg-black/30 p-5 leading-7 text-white" />
              {result.copy?.disclosure ? <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">Affiliate disclosure included: {result.copy.disclosure}</div> : null}
              {result.copy?.destinationUrl ? <a href={result.copy.destinationUrl} target="_blank" rel="noreferrer" className="mt-4 block break-all text-sm text-sky-300">Tracked website destination: {result.copy.destinationUrl}</a> : null}
            </div>
          </div>}
        </section>
      </div>

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Content mix</div>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">A healthier feed than endless finished dishes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[['Teach','Ingredients, techniques and mistakes give people a reason to save.'],['Show process','Behind-the-recipe content feels human and builds trust.'],['Solve a problem','Meal planning and dinner ideas create useful website visits.'],['Recommend honestly','Affiliate features stay contextual, disclosed and helpful.']].map(([title, body]) => <div key={title} className="rounded-2xl border border-[var(--border)] bg-black/20 p-5"><div className="font-extrabold text-white">{title}</div><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{body}</p></div>)}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[['LIVE','Standard recipe'],['LIVE','Teaching card'],['LIVE','Process card'],['NOT BUILT','Cooking scene'],['NOT BUILT','Carousel']].map(([status, label]) => <div key={label} className="rounded-xl border border-[var(--brand-gold)]/20 bg-black/15 p-4"><div className={`text-sm font-extrabold ${status === 'LIVE' ? 'text-emerald-300' : 'text-amber-300'}`}>{status}</div><div className="mt-1 text-sm font-bold text-white">{label}</div></div>)}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">All live formats use the bundled Rajdhani typeface. Cooking scenes and true multi-image carousels are shown as unavailable until their generators and publishers are genuinely implemented.</p>
      </section>
    </main>
  );
}
