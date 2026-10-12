"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type RecipeOption = { slug: string; label: string };

type OutputId = "full" | "reel" | "pinterest" | "technique" | "tempering" | "reveal";

type RenderResult = {
  id: OutputId;
  label: string;
  fileName: string;
  previewUrl: string;
  width: number;
  height: number;
  duration: number;
};

const releaseOrder: Array<{ output: OutputId; timing: string; platforms: string }> = [
  { output: "full", timing: "Launch evening", platforms: "YouTube and Facebook" },
  { output: "reel", timing: "Following evening", platforms: "Instagram, Facebook and TikTok" },
  { output: "pinterest", timing: "Two days after launch", platforms: "Pinterest · Indian Recipes board" },
  { output: "technique", timing: "Four days after launch", platforms: "Instagram, Facebook and TikTok" },
  { output: "tempering", timing: "One week after launch", platforms: "Instagram, Facebook and TikTok" },
  { output: "reveal", timing: "Ten days after launch", platforms: "Instagram, Facebook and TikTok" },
];

function timeLabel(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

export default function RecipeLaunchPackClient({ recipes }: { recipes: RecipeOption[] }) {
  const [recipeSlug, setRecipeSlug] = useState(recipes[0]?.slug || "");
  const [packDirectory, setPackDirectory] = useState("");
  const [status, setStatus] = useState("Ready. Nothing has been read, uploaded, queued or published.");
  const [isRendering, setIsRendering] = useState(false);
  const [jobId, setJobId] = useState("");
  const [renders, setRenders] = useState<RenderResult[]>([]);
  const [approved, setApproved] = useState<OutputId[]>([]);
  const [uploading, setUploading] = useState<OutputId | null>(null);
  const [productionUrls, setProductionUrls] = useState<Partial<Record<OutputId, string>>>({});
  const selectedRecipe = recipes.find((recipe) => recipe.slug === recipeSlug);
  const destination = `https://www.vegan-masala.com/recipes/${recipeSlug}`;

  const folderLooksReady = useMemo(
    () => packDirectory.trim().length > 8 && Boolean(selectedRecipe),
    [packDirectory, selectedRecipe],
  );

  async function renderPack() {
    if (!selectedRecipe || !folderLooksReady) {
      setStatus("Choose a recipe and paste the complete publishing-pack folder path.");
      return;
    }
    setIsRendering(true);
    setRenders([]);
    setApproved([]);
    setProductionUrls({});
    setStatus("Reading the local RecipeWorks pack, selecting useful moments and rendering six branded videos…");
    try {
      const response = await fetch("/api/admin/social/launch-pack/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packDirectory, slug: selectedRecipe.slug, title: selectedRecipe.label }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "The launch pack could not be rendered.");
      setJobId(data.jobId);
      setRenders(data.results || []);
      setStatus(`${data.message}${data.captionsFound ? " RecipeWorks captions were used to find the strongest steps." : " No captions were found, so review the selected moments carefully."}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The launch pack could not be rendered.");
    } finally {
      setIsRendering(false);
    }
  }

  function toggleApproval(id: OutputId) {
    setApproved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function uploadApproved(result: RenderResult) {
    if (!approved.includes(result.id) || !selectedRecipe) return;
    setUploading(result.id);
    setStatus(`Uploading the approved ${result.label} file to production storage…`);
    try {
      const response = await fetch("/api/admin/social/production/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          fileName: result.fileName,
          slug: selectedRecipe.slug,
          output: result.id,
          approved: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Upload failed.");
      setProductionUrls((current) => ({ ...current, [result.id]: data.url }));
      setStatus("Approved video uploaded to production storage. It has not been queued or posted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Approved upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function clearJob() {
    if (jobId) {
      await fetch("/api/admin/social/production/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      }).catch(() => null);
    }
    setJobId("");
    setRenders([]);
    setApproved([]);
    setProductionUrls({});
    setStatus("Local launch job cleared. Your original RecipeWorks files were not changed.");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm sm:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">Admin · Recipe Video Launch Pack</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)] sm:text-4xl">Turn one finished recipe video into a two-week campaign</h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">
              Point the utility at a RecipeWorks publishing-pack folder. It reads the existing landscape and vertical masters directly from your Mac, uses the caption timings to find useful stages, adds music and finishes every video with the same logo, patterned background, Rajdhani type and gold border used by the opening frame.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/social/production" className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--brand-gold)]">Raw Footage Studio</Link>
          </div>
        </div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_390px]">
        <div className="space-y-7">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">1 · Choose the recipe</p>
            <select value={recipeSlug} onChange={(event) => setRecipeSlug(event.target.value)} className="mt-4 w-full rounded-xl border border-[var(--border)] bg-black/25 px-4 py-3 text-white">
              {recipes.map((recipe) => <option key={recipe.slug} value={recipe.slug}>{recipe.label}</option>)}
            </select>
            <p className="mt-3 break-all text-sm text-[var(--text-soft)]">Destination: {destination}</p>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">2 · Locate the completed publishing pack</p>
            <label className="mt-4 block text-sm font-extrabold text-[var(--brand-gold)]" htmlFor="pack-directory">Folder path on this Mac</label>
            <input
              id="pack-directory"
              value={packDirectory}
              onChange={(event) => setPackDirectory(event.target.value)}
              placeholder="/Users/your-name/Desktop/.../recipe-publishing-pack"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/25 px-4 py-3 text-white"
            />
            <div className="mt-5 rounded-2xl border border-[var(--brand-gold)]/35 bg-black/15 p-5 text-sm leading-6 text-[var(--text-soft)]">
              <strong className="text-white">In Finder:</strong> select the publishing-pack folder, hold Option, open the Edit menu and choose “Copy … as Pathname”, then paste it above. The folder should contain <code>video-16x9.mp4</code>, <code>video-9x16.mp4</code> and preferably <code>captions.srt</code>. Large masters are read directly and are not uploaded through the browser.
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">3 · Outputs created automatically</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {releaseOrder.map((item) => (
                <article key={item.output} className="rounded-2xl border border-[var(--border)] bg-black/10 p-5">
                  <h2 className="font-extrabold text-[var(--brand-gold)]">{item.platforms}</h2>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{item.timing}</p>
                </article>
              ))}
            </div>
          </section>

          {renders.length ? (
            <section className="rounded-3xl border border-emerald-400/40 bg-[var(--surface)] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">4 · Watch every result</p>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {renders.map((result) => {
                  const isApproved = approved.includes(result.id);
                  const productionUrl = productionUrls[result.id];
                  return (
                    <article key={result.id} className="rounded-2xl border border-[var(--border)] bg-black/15 p-4">
                      <h2 className="font-extrabold text-[var(--brand-gold)]">{result.label}</h2>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">{result.width} × {result.height} · {timeLabel(result.duration)}</p>
                      <video className="mt-4 max-h-[620px] w-full rounded-xl border border-[var(--border)] bg-black object-contain" controls playsInline preload="metadata" src={result.previewUrl} />
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-sm text-white">
                        <input className="mt-1" type="checkbox" checked={isApproved} onChange={() => toggleApproval(result.id)} />
                        <span><strong className="block">I have watched and approve this output</strong><span className="mt-1 block text-xs text-[var(--text-soft)]">This only permits an upload; it does not queue or publish the video.</span></span>
                      </label>
                      {productionUrl ? (
                        <a href={productionUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all rounded-xl border border-emerald-400/40 p-3 text-xs font-bold text-emerald-300">Production file: {productionUrl}</a>
                      ) : (
                        <button type="button" disabled={!isApproved || uploading !== null} onClick={() => uploadApproved(result)} className="mt-3 w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">
                          {uploading === result.id ? "Uploading…" : "Upload approved file to production"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-7 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-3xl border border-[var(--brand-gold)]/50 bg-[var(--surface)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">End-card standard</p>
            <div className="mt-4 rounded-2xl border-2 border-[var(--brand-gold)] bg-[#07131b] p-7 text-center">
              <div className="mx-auto h-16 w-16 rounded-full border border-[var(--brand-gold)]/60 bg-[var(--brand-gold)]/10" />
              <p className="mt-7 font-extrabold uppercase tracking-wide text-white">See complete recipe at</p>
              <p className="mt-2 text-xl font-extrabold text-[var(--brand-gold)]">WWW.VEGAN-MASALA.COM</p>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-[var(--text-soft)]">
              <li>✓ Opening frame reused as the background</li>
              <li>✓ Existing logo and ornate gold border retained</li>
              <li>✓ Rajdhani type and brand colours</li>
              <li>✓ Three-second readable hold</li>
              <li>✓ Music continues and fades cleanly</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm leading-6 text-[var(--text-soft)]">{status}</p>
            <button type="button" disabled={!folderLooksReady || isRendering} onClick={renderPack} className="mt-5 w-full rounded-xl bg-[var(--brand-red)] px-5 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45">
              {isRendering ? "Rendering launch pack locally…" : "Generate six launch videos"}
            </button>
            <button type="button" onClick={clearJob} className="mt-3 w-full px-5 py-2 text-sm font-bold text-red-300">Clear local launch job</button>
          </section>
        </aside>
      </div>
    </main>
  );
}
