"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type RecipeOption = {
  slug: string;
  label: string;
};

type FootageSlot = {
  id: string;
  number: string;
  title: string;
  guidance: string;
  required: boolean;
  instruction?: string;
};

type RecipeStep = {
  id: string;
  number: number;
  instruction: string;
  caption: string;
};

type TemplateId = "complete" | "technique" | "mistake" | "ingredient" | "quick";
type OutputId = "recipe" | "youtube" | "reel" | "short" | "tiktok" | "pinterest";

type RenderResult = {
  id: OutputId;
  label: string;
  fileName: string;
  previewUrl: string;
  width: number;
  height: number;
};

const templates: Array<{ id: TemplateId; title: string; description: string; length: string }> = [
  { id: "complete", title: "Complete recipe", description: "A clear beginning-to-end method with every important cooking cue.", length: "4–8 min" },
  { id: "technique", title: "Essential technique", description: "One useful step explained closely and linked to the full recipe.", length: "20–45 sec" },
  { id: "mistake", title: "Common mistake", description: "Show what goes wrong, how to recognise it and how to recover.", length: "20–40 sec" },
  { id: "ingredient", title: "Ingredient story", description: "Introduce one spice or ingredient and demonstrate its role.", length: "25–50 sec" },
  { id: "quick", title: "Quick version", description: "A fast visual summary for Reels, TikTok and Shorts.", length: "30–60 sec" },
];

const outputs: Array<{ id: OutputId; title: string; format: string }> = [
  { id: "recipe", title: "Recipe-page method", format: "16:9 · web" },
  { id: "youtube", title: "YouTube recipe", format: "16:9 · landscape" },
  { id: "reel", title: "Instagram / Facebook Reel", format: "9:16 · vertical" },
  { id: "short", title: "YouTube Short", format: "9:16 · vertical" },
  { id: "tiktok", title: "TikTok", format: "9:16 · vertical" },
  { id: "pinterest", title: "Pinterest video Pin", format: "2:3 · portrait" },
];

const brandOptions = [
  "Rajdhani typography",
  "Gold, black and red treatment",
  "Vegan Masala logo",
  "Branded recipe title",
  "Subtitle-safe caption area",
  "Bright first frame",
  "Branded end card",
];

function LocalVideoPreview({ file }: { file: File }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const url = URL.createObjectURL(file);
    video.src = url;
    return () => {
      video.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return <video ref={videoRef} controls muted playsInline className="h-full w-full object-contain" />;
}

export default function RawFootageStudioClient({ recipes }: { recipes: RecipeOption[] }) {
  const [recipeSlug, setRecipeSlug] = useState(recipes[0]?.slug || "");
  const [template, setTemplate] = useState<TemplateId>("complete");
  const [selectedOutputs, setSelectedOutputs] = useState<OutputId[]>(["recipe", "reel", "short"]);
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
  const [stepCaptions, setStepCaptions] = useState<Record<string, string>>({});
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [status, setStatus] = useState("Local studio ready. No files have been uploaded or published.");
  const [jobId, setJobId] = useState("");
  const [renders, setRenders] = useState<RenderResult[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [approved, setApproved] = useState<OutputId[]>([]);
  const [uploading, setUploading] = useState<OutputId | null>(null);
  const [productionUrls, setProductionUrls] = useState<Partial<Record<OutputId, string>>>({});

  useEffect(() => {
    if (!recipeSlug) return;
    let active = true;
    fetch(`/api/admin/social/production/recipe/${encodeURIComponent(recipeSlug)}`, { cache: "no-store" })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!active) return;
        if (!response.ok || !data.ok) throw new Error(data.error || "Recipe steps could not be loaded.");
        const nextSteps = (data.recipe?.steps || []) as RecipeStep[];
        setRecipeSteps(nextSteps);
        setStepCaptions(Object.fromEntries(nextSteps.map((step) => [step.id, step.caption])));
        setFiles({});
        setRenders([]);
        setApproved([]);
        setProductionUrls({});
        setJobId("");
        setStatus(`${nextSteps.length} recipe steps loaded. Add unique footage for each method step.`);
      })
      .catch((error) => {
        if (active) setStatus(error instanceof Error ? error.message : "Recipe steps could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoadingSteps(false);
      });
    return () => {
      active = false;
    };
  }, [recipeSlug]);

  const footageSlots = useMemo<FootageSlot[]>(() => [
    { id: "finished", number: "00", title: "Opening finished dish", guidance: "A bright first frame showing the completed recipe.", required: true },
    ...recipeSteps.map((step) => ({
      id: step.id,
      number: String(step.number).padStart(2, "0"),
      title: `Method step ${step.number}`,
      guidance: "Add footage or a photograph showing this exact action.",
      required: true,
      instruction: step.instruction,
    })),
    { id: "presenter", number: "+", title: "Craig on camera", guidance: "Optional introduction, explanation or tasting reaction.", required: false },
  ], [recipeSteps]);

  const previewFile = useMemo(() => {
    for (const slot of footageSlots) {
      const video = (files[slot.id] || []).find((file) => file.type.startsWith("video/"));
      if (video) return video;
    }
    return null;
  }, [files, footageSlots]);

  const uploadedSlots = footageSlots.filter((slot) => (files[slot.id] || []).length > 0).length;
  const requiredSlots = footageSlots.filter((slot) => slot.required);
  const completedRequired = requiredSlots.filter((slot) => (files[slot.id] || []).length > 0).length;
  const readiness = Math.round((completedRequired / requiredSlots.length) * 100);
  const selectedRecipe = recipes.find((recipe) => recipe.slug === recipeSlug);
  const selectedTemplate = templates.find((item) => item.id === template) || templates[0];

  function addFiles(slotId: string, list: FileList | null) {
    if (!list?.length) return;
    setFiles((current) => ({ ...current, [slotId]: [...(current[slotId] || []), ...Array.from(list)] }));
    setStatus("Footage added locally. It has not left this browser.");
  }

  function removeFile(slotId: string, index: number) {
    setFiles((current) => ({
      ...current,
      [slotId]: (current[slotId] || []).filter((_, fileIndex) => fileIndex !== index),
    }));
  }

  function toggleOutput(id: OutputId) {
    setSelectedOutputs((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function saveBrief() {
    const brief = {
      recipe: selectedRecipe || { slug: recipeSlug, label: recipeSlug },
      template: selectedTemplate,
      outputs: outputs.filter((output) => selectedOutputs.includes(output.id)),
      footage: footageSlots.map((slot) => ({
        slot: slot.id,
        title: slot.title,
        instruction: slot.instruction,
        caption: stepCaptions[slot.id] || (slot.id === "finished" ? selectedRecipe?.label : ""),
        required: slot.required,
        files: (files[slot.id] || []).map((file) => file.name),
      })),
      brand: brandOptions,
      publishAllowed: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("vegan-masala-raw-footage-brief", JSON.stringify(brief));
    setStatus("Production brief saved in this browser. Nothing has been rendered or published.");
  }

  async function renderDrafts() {
    if (!selectedRecipe) {
      setStatus("Choose a recipe before rendering.");
      return;
    }
    const descriptors: Array<{ field: string; slot: string; order: number; caption: string }> = [];
    const form = new FormData();
    footageSlots.forEach((slot) => {
      (files[slot.id] || []).forEach((file, order) => {
        const field = `source-${slot.id}-${order}`;
        descriptors.push({
          field,
          slot: slot.id,
          order,
          caption: stepCaptions[slot.id] || (slot.id === "finished" ? selectedRecipe.label : ""),
        });
        form.append(field, file, file.name);
      });
    });
    if (!descriptors.length) {
      setStatus("Add at least one clip or photograph before rendering.");
      return;
    }
    if (!selectedOutputs.length) {
      setStatus("Choose at least one output format.");
      return;
    }

    form.append("metadata", JSON.stringify({
      slug: selectedRecipe.slug,
      title: selectedRecipe.label,
      template,
      outputs: selectedOutputs,
      files: descriptors,
    }));

    setIsRendering(true);
    setRenders([]);
    setApproved([]);
    setProductionUrls({});
    setStatus("Copying source files to the private local job and rendering with FFmpeg…");
    try {
      const response = await fetch("/api/admin/social/production/render", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Local render failed.");
      setJobId(data.jobId);
      setRenders(data.results || []);
      setStatus(data.message || "Draft videos rendered locally. Nothing has been uploaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Local render failed.");
    } finally {
      setIsRendering(false);
    }
  }

  function toggleApproval(id: OutputId) {
    setApproved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function uploadApproved(result: RenderResult) {
    if (!approved.includes(result.id)) return;
    setUploading(result.id);
    setStatus(`Uploading the approved ${result.label} render to production storage…`);
    try {
      const response = await fetch("/api/admin/social/production/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          fileName: result.fileName,
          slug: selectedRecipe?.slug,
          output: result.id,
          approved: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Upload failed.");
      setProductionUrls((current) => ({ ...current, [result.id]: data.url }));
      setStatus(data.message || "Approved render uploaded. It has not been published.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Approved render upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function resetDraft() {
    if (jobId) {
      await fetch("/api/admin/social/production/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      }).catch(() => null);
    }
    setFiles({});
    setTemplate("complete");
    setSelectedOutputs(["recipe", "reel", "short"]);
    setRenders([]);
    setApproved([]);
    setProductionUrls({});
    setJobId("");
    setStepCaptions(Object.fromEntries(recipeSteps.map((step) => [step.id, step.caption])));
    localStorage.removeItem("vegan-masala-raw-footage-brief");
    setStatus("Local job cleared. Your original source files on the Mac were not changed.");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm sm:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">
              Admin · Raw Footage Studio
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)] sm:text-4xl">
              Turn genuine cooking footage into a complete content pack
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">
              Choose a real recipe, place your clips into repeatable shot slots and define every output before rendering. This framework keeps the authentic cooking in your hands and automates the repetitive production work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/social" className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--brand-gold)]">
              Back to admin hub
            </Link>
            <Link href="/admin/social/video" className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--brand-gold)]">
              Existing video tool
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--text-soft)] sm:grid-cols-5">
          {["1 · Recipe", "2 · Footage", "3 · Story", "4 · Outputs", "5 · Review"].map((step, index) => (
            <div key={step} className={`rounded-xl border px-4 py-3 ${index === 1 ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]" : "border-[var(--border)] bg-black/10"}`}>
              {step}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_380px]">
        <div className="space-y-7">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Step 1</p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">Choose the verified recipe</h2>
              </div>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                Recipe data supplies the facts
              </span>
            </div>
            <label className="mt-5 block text-sm font-bold text-[var(--brand-gold)]" htmlFor="recipe">
              Recipe
            </label>
            <select
              id="recipe"
              value={recipeSlug}
              disabled={recipes.length === 0}
              onChange={(event) => {
                setIsLoadingSteps(true);
                setRecipeSlug(event.target.value);
              }}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/25 px-4 py-3 text-white"
            >
              {recipes.map((recipe) => <option key={recipe.slug} value={recipe.slug}>{recipe.label}</option>)}
            </select>
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
              Ingredients, method steps, timings and the destination URL will come from this published recipe rather than being invented during editing.
            </p>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Step 2</p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">Add footage to the shot list</h2>
              </div>
              <div className="text-sm font-bold text-[var(--brand-gold)]">
                {isLoadingSteps ? "Loading method…" : `${uploadedSlots} of ${footageSlots.length} slots filled`}
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {footageSlots.map((slot) => {
                const slotFiles = files[slot.id] || [];
                return (
                  <article key={slot.id} className={`rounded-2xl border p-5 ${slotFiles.length ? "border-emerald-400/45 bg-emerald-400/[0.06]" : "border-[var(--border)] bg-black/10"}`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand-red)] text-xs font-extrabold text-white">{slot.number}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-[var(--brand-gold)]">{slot.title}</h3>
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">{slot.required ? "Required" : "Optional"}</span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{slot.guidance}</p>
                      </div>
                    </div>
                    {slot.instruction ? (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl border border-[var(--border)] bg-black/20 p-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-soft)]">Website instruction</span>
                          <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{slot.instruction}</p>
                        </div>
                        <label className="block text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-gold)]">
                          On-screen step text
                          <textarea
                            value={stepCaptions[slot.id] || ""}
                            onChange={(event) => setStepCaptions((current) => ({ ...current, [slot.id]: event.target.value.slice(0, 110) }))}
                            rows={2}
                            className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-black/25 px-3 py-2 text-sm normal-case tracking-normal text-white"
                          />
                          <span className="mt-1 block text-right text-[10px] text-[var(--text-soft)]">{(stepCaptions[slot.id] || "").length}/110</span>
                        </label>
                      </div>
                    ) : null}
                    <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--brand-gold)]/55 bg-black/15 px-4 py-4 text-center text-sm font-bold text-[var(--brand-gold)] hover:bg-white/5">
                      Add clips or photographs
                      <input className="sr-only" type="file" accept="video/*,image/*" multiple onChange={(event) => addFiles(slot.id, event.target.files)} />
                    </label>
                    {slotFiles.length ? (
                      <ul className="mt-3 space-y-2">
                        {slotFiles.map((file, index) => (
                          <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2 text-xs text-[var(--text-soft)]">
                            <span className="min-w-0 truncate">{file.name}</span>
                            <button type="button" onClick={() => removeFile(slot.id, index)} className="font-bold text-red-300">Remove</button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Step 3</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">Choose the story</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTemplate(item.id)}
                  className={`rounded-2xl border p-5 text-left transition ${template === item.id ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10" : "border-[var(--border)] bg-black/10 hover:bg-white/5"}`}
                >
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--brand-gold)]">{item.length}</span>
                  <h3 className="mt-2 font-extrabold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{item.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Step 4</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">Select the outputs</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {outputs.map((output) => (
                <label key={output.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${selectedOutputs.includes(output.id) ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10" : "border-[var(--border)] bg-black/10"}`}>
                  <input type="checkbox" checked={selectedOutputs.includes(output.id)} onChange={() => toggleOutput(output.id)} className="mt-1" />
                  <span><strong className="block text-sm text-white">{output.title}</strong><span className="mt-1 block text-xs text-[var(--text-soft)]">{output.format}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-7 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-3xl border border-[var(--brand-gold)]/50 bg-[var(--surface)] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">Draft preview</p><h2 className="mt-1 text-xl font-extrabold text-white">{selectedRecipe?.label || "Choose a recipe"}</h2></div>
              <span className="rounded-full bg-[var(--brand-red)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">Not published</span>
            </div>
            <div className="relative mx-auto mt-5 aspect-[9/16] max-h-[520px] overflow-hidden rounded-2xl border border-[var(--brand-gold)]/50 bg-black">
              {previewFile ? (
                <LocalVideoPreview file={previewFile} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--brand-gold)] text-2xl text-[var(--brand-gold)]">▶</div>
                  <p className="mt-5 font-extrabold text-[var(--brand-gold)]">Your first video clip will appear here</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">The eventual render will use the chosen aspect ratio, branding and captions.</p>
                </div>
              )}
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm"><span className="font-bold text-white">Required footage</span><span className="font-extrabold text-[var(--brand-gold)]">{readiness}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-[var(--brand-gold)] transition-all" style={{ width: `${readiness}%` }} /></div>
              <p className="mt-2 text-xs text-[var(--text-soft)]">{completedRequired} of {requiredSlots.length} required shot types supplied</p>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">Automatic brand treatment</p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-soft)]">
              {brandOptions.map((item) => <li key={item} className="flex gap-3"><span className="text-emerald-300">✓</span><span>{item}</span></li>)}
            </ul>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">Quality gates before approval</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
              <li>□ No black or blank opening frame</li>
              <li>□ Correct dish and recipe claims</li>
              <li>□ Text remains inside platform safe zones</li>
              <li>□ Subtitles checked against the spoken audio</li>
              <li>□ Final texture is visible</li>
              <li>□ Every destination link is correct</li>
              <li>□ Craig approves before queueing</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-[var(--brand-gold)]/40 bg-[var(--surface)] p-6">
            <p className="text-sm leading-6 text-[var(--text-soft)]">{status}</p>
            <button type="button" onClick={saveBrief} className="mt-5 w-full rounded-xl bg-[var(--brand-red)] px-5 py-3 font-extrabold text-white">
              Save production brief
            </button>
            <button
              type="button"
              onClick={renderDrafts}
              disabled={isRendering || uploadedSlots === 0 || selectedOutputs.length === 0}
              className="mt-3 w-full rounded-xl border border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 px-5 py-3 font-extrabold text-[var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isRendering ? "Rendering locally…" : "Generate local draft videos"}
            </button>
            <button type="button" onClick={resetDraft} className="mt-3 w-full px-5 py-2 text-sm font-bold text-red-300">
              Clear local job and selections
            </button>
          </section>

          {renders.length ? (
            <section className="rounded-3xl border border-emerald-400/40 bg-[var(--surface)] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Local renders · review required</p>
              <div className="mt-5 space-y-6">
                {renders.map((result) => {
                  const isApproved = approved.includes(result.id);
                  const productionUrl = productionUrls[result.id];
                  return (
                    <article key={result.id} className="rounded-2xl border border-[var(--border)] bg-black/15 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-extrabold text-[var(--brand-gold)]">{result.label}</h3>
                          <p className="mt-1 text-xs text-[var(--text-soft)]">{result.width} × {result.height} · stored locally</p>
                        </div>
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-300">Rendered</span>
                      </div>
                      <video className="mt-4 w-full rounded-xl border border-[var(--border)] bg-black" controls playsInline preload="metadata" src={result.previewUrl} />
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-sm text-white">
                        <input className="mt-1" type="checkbox" checked={isApproved} onChange={() => toggleApproval(result.id)} />
                        <span><strong className="block">I have watched and approve this render</strong><span className="mt-1 block text-xs text-[var(--text-soft)]">Approval permits upload only. It does not post or queue the video.</span></span>
                      </label>
                      {productionUrl ? (
                        <a className="mt-3 block break-all rounded-xl border border-emerald-400/40 p-3 text-xs font-bold text-emerald-300" href={productionUrl} target="_blank" rel="noreferrer">Production file: {productionUrl}</a>
                      ) : (
                        <button
                          type="button"
                          disabled={!isApproved || uploading !== null}
                          onClick={() => uploadApproved(result)}
                          className="mt-3 w-full rounded-xl bg-[var(--brand-red)] px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {uploading === result.id ? "Uploading approved render…" : "Upload approved render to production"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
