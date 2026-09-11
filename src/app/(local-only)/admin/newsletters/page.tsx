"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RecipeChoice = { slug: string; title: string; description: string; image: string };
type GuideChoice = { slug: string; title: string; description: string };
type Newsletter = {
  subject: string; previewText: string; introduction: string;
  recipes: Array<{ slug: string; heading: string; description: string; cta: string }>;
  guide: { slug: string; heading: string; description: string; cta: string };
  affiliate: { key: string; title: string; description: string; cta: string } | null;
  tipTitle: string; tipBody: string; closing: string; postscript: string;
};
type KitOverview = {
  configured: boolean; subscribers: number | null; error?: string | null;
  broadcasts: Array<{ id: number; subject?: string; created_at?: string; send_at?: string | null; public?: boolean }>;
};
type AutomationConfig = {
  enabled: boolean; startAt: string; cadenceWeeks: 1 | 2; weekday: number; hour: number; minute: number;
  recipeCount: number; theme: string; publishToWeb: boolean; updatedAt: string;
  includeAffiliate: boolean;
};
type AutomationState = {
  lastRunAt?: string; lastSentAt?: string; lastBroadcastId?: number; lastSubject?: string;
  lastRecipientCount?: number; lastError?: string;
};

const DEFAULT_AUTOMATION: AutomationConfig = {
  enabled: true, startAt: "2026-09-17T09:00:00.000Z", cadenceWeeks: 2, weekday: 4, hour: 10, minute: 0, recipeCount: 3,
  theme: "A fresh selection from the Vegan Masala kitchen", publishToWeb: false, updatedAt: "",
  includeAffiliate: true,
};

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { ok: false, error: text || "Invalid response" }; }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function localDateTime(minutesAhead = 60) {
  const date = new Date(Date.now() + minutesAhead * 60_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function isoToLocalDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function NewsletterStudioPage() {
  const [recipes, setRecipes] = useState<RecipeChoice[]>([]);
  const [guides, setGuides] = useState<GuideChoice[]>([]);
  const [kit, setKit] = useState<KitOverview>({ configured: false, subscribers: null, broadcasts: [] });
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [theme, setTheme] = useState("");
  const [guideSlug, setGuideSlug] = useState("");
  const [includeAffiliate, setIncludeAffiliate] = useState(true);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [html, setHtml] = useState("");
  const [sendMode, setSendMode] = useState<"draft" | "schedule" | "send">("draft");
  const [sendAt, setSendAt] = useState(() => localDateTime());
  const [publishToWeb, setPublishToWeb] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading Kit and recipe data…");
  const [resultUrl, setResultUrl] = useState("");
  const [automation, setAutomation] = useState<AutomationConfig>(DEFAULT_AUTOMATION);
  const [automationState, setAutomationState] = useState<AutomationState>({});
  const [automationStorage, setAutomationStorage] = useState(false);
  const [automationConfirmed, setAutomationConfirmed] = useState(false);
  const [automationStatus, setAutomationStatus] = useState("Loading newsletter schedule…");
  const [savingAutomation, setSavingAutomation] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [response, automationResponse] = await Promise.all([
        fetch("/api/admin/newsletters", { cache: "no-store" }),
        fetch("/api/admin/newsletters/automation", { cache: "no-store" }),
      ]);
      const [data, automationData] = await Promise.all([readJson(response), readJson(automationResponse)]);
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not load newsletter data");
      const nextRecipes = Array.isArray(data.recipes) ? data.recipes : [];
      setRecipes(nextRecipes);
      const nextGuides = Array.isArray(data.guides) ? data.guides : [];
      setGuides(nextGuides);
      setKit(data.kit || { configured: false, subscribers: null, broadcasts: [] });
      setSelectedSlugs((current) => current.length ? current : nextRecipes.slice(0, 3).map((recipe: RecipeChoice) => recipe.slug));
      setStatus(data.kit?.error || "Choose up to five recipes, then generate a newsletter preview.");
      if (automationResponse.ok && automationData.ok) {
        setAutomation({ ...DEFAULT_AUTOMATION, ...(automationData.config || {}) });
        setAutomationState(automationData.state || {});
        setAutomationStorage(Boolean(automationData.configured));
        setAutomationStatus(automationData.configured ? "Schedule loaded." : "Persistent storage is not configured for scheduling.");
      } else {
        setAutomationStatus(automationData.error || "Could not load newsletter schedule");
      }
    } catch (error: unknown) { setStatus(errorMessage(error, "Could not load newsletter data")); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const selectedRecipes = useMemo(() => selectedSlugs.map((slug) => recipes.find((recipe) => recipe.slug === slug)).filter(Boolean) as RecipeChoice[], [recipes, selectedSlugs]);

  function toggleRecipe(slug: string) {
    setSelectedSlugs((current) => current.includes(slug) ? current.filter((item) => item !== slug) : current.length < 5 ? [...current, slug] : current);
    setNewsletter(null); setHtml(""); setResultUrl(""); setConfirmed(false);
  }

  async function generate() {
    setLoading(true); setStatus("Writing a useful, recipe-specific newsletter…"); setResultUrl("");
    try {
      const response = await fetch("/api/admin/newsletters", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", slugs: selectedSlugs, theme, guideSlug, includeAffiliate }),
      });
      const data = await readJson(response);
      if (!response.ok || !data.ok) throw new Error(data.error || "Newsletter generation failed");
      setNewsletter(data.newsletter); setHtml(data.html || ""); setStatus("Preview generated. Review and edit every section before creating the Kit broadcast.");
    } catch (error: unknown) { setStatus(errorMessage(error, "Newsletter generation failed")); }
    finally { setLoading(false); }
  }

  function update<K extends keyof Newsletter>(key: K, value: Newsletter[K]) {
    setNewsletter((current) => current ? { ...current, [key]: value } : current);
    setHtml(""); setConfirmed(false); setResultUrl("");
  }

  function updateRecipe(index: number, key: "heading" | "description" | "cta", value: string) {
    if (!newsletter) return;
    update("recipes", newsletter.recipes.map((recipe, recipeIndex) => recipeIndex === index ? { ...recipe, [key]: value } : recipe));
  }

  async function refreshHtml() {
    if (!newsletter) return;
    setLoading(true); setStatus("Refreshing the branded preview…");
    try {
      const response = await fetch("/api/admin/newsletters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preview", newsletter }) });
      const data = await readJson(response);
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not refresh preview");
      setHtml(data.html || ""); setStatus("Preview refreshed. Review it before creating or sending the broadcast.");
    } catch (error: unknown) { setStatus(errorMessage(error, "Could not refresh preview")); }
    finally { setLoading(false); }
  }

  async function createBroadcastDraft() {
    if (!newsletter) return;
    setLoading(true); setStatus("Refreshing the preview…");
    try {
      const response = await fetch("/api/admin/newsletters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", newsletter }) });
      const data = await readJson(response);
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not create Kit draft");
      setResultUrl(data.kitUrl || "https://app.kit.com/campaigns"); setStatus("Kit draft created. Open it for Kit's final rendering and deliverability preview.");
    } catch (error: unknown) { setStatus(errorMessage(error, "Could not create Kit draft")); }
    finally { setLoading(false); }
  }

  async function publish() {
    if (!newsletter) return;
    setLoading(true); setResultUrl(""); setStatus(sendMode === "send" ? "Sending the reviewed newsletter through Kit…" : "Scheduling the reviewed newsletter through Kit…");
    try {
      const response = await fetch("/api/admin/newsletters", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: sendMode, newsletter, sendAt: sendMode === "schedule" ? new Date(sendAt).toISOString() : null, publishToWeb, confirmedRecipientCount: confirmed ? kit.subscribers : null }),
      });
      const data = await readJson(response);
      if (!response.ok || !data.ok) throw new Error(data.error || "Kit publishing failed");
      setResultUrl(data.kitUrl || "https://app.kit.com/campaigns");
      setStatus(sendMode === "send" ? `Newsletter sent to ${data.recipients} subscribers.` : `Newsletter scheduled for ${new Date(sendAt).toLocaleString("en-GB")}.`);
      setConfirmed(false);
    } catch (error: unknown) { setStatus(errorMessage(error, "Kit publishing failed")); }
    finally { setLoading(false); }
  }

  function changeAutomation<K extends keyof AutomationConfig>(key: K, value: AutomationConfig[K]) {
    setAutomation((current) => ({ ...current, [key]: value }));
    setAutomationConfirmed(false);
  }

  async function saveAutomation() {
    setSavingAutomation(true);
    setAutomationStatus(automation.enabled ? "Enabling automatic newsletter delivery…" : "Saving newsletter schedule…");
    try {
      const response = await fetch("/api/admin/newsletters/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: automation, confirmAutomaticSending: automationConfirmed }),
      });
      const data = await readJson(response);
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not save newsletter schedule");
      setAutomation(data.config);
      setAutomationConfirmed(false);
      setAutomationStatus(data.config.enabled
        ? `Automatic delivery is active: every ${data.config.cadenceWeeks === 1 ? "week" : "two weeks"} on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][data.config.weekday]} at ${String(data.config.hour).padStart(2, "0")}:${String(data.config.minute).padStart(2, "0")} UK time.`
        : "Automatic delivery is paused. Your timing and content settings have been saved.");
    } catch (error: unknown) {
      setAutomationStatus(errorMessage(error, "Could not save newsletter schedule"));
    } finally {
      setSavingAutomation(false);
    }
  }

  return <main className="mx-auto max-w-7xl px-6 py-10">
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">Admin · Newsletter Studio</div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div><h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">Generate and publish Kit newsletters</h1><p className="mt-3 max-w-3xl text-[var(--text-soft)]">Build a consistent, branded email from real recipe data. Nothing is sent until you review the preview and confirm the current audience.</p></div>
        <Link href="/admin/social" className="rounded-xl border border-[var(--border)] px-5 py-3 font-bold text-[var(--brand-gold)]">Back to admin hub</Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/20 p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Kit connection</div><div className={`mt-2 text-xl font-extrabold ${kit.configured && !kit.error ? "text-emerald-300" : "text-amber-300"}`}>{kit.configured ? kit.error ? "Needs attention" : "Connected" : "Not configured"}</div></div>
        <div className="rounded-2xl bg-black/20 p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Active audience</div><div className="mt-2 text-3xl font-extrabold text-white">{kit.subscribers ?? "—"}</div></div>
        <div className="rounded-2xl bg-black/20 p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Recent broadcasts</div><div className="mt-2 text-3xl font-extrabold text-white">{kit.broadcasts?.length || 0}</div></div>
      </div>
    </section>

    <div className="mt-8 grid gap-7 lg:grid-cols-[420px_1fr]">
      <section className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">1. Choose the content</h2>
        <label className="mt-5 block text-sm font-bold text-[var(--brand-gold)]">Optional theme or angle</label>
        <input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="e.g. Three warming dinners for autumn" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white" />
        <label className="mt-5 block text-sm font-bold text-[var(--brand-gold)]">Guide to include</label>
        <select value={guideSlug} onChange={(event) => { setGuideSlug(event.target.value); setNewsletter(null); setHtml(""); }} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white"><option value="">Choose the most relevant guide automatically</option>{guides.map((guide) => <option key={guide.slug} value={guide.slug}>{guide.title}</option>)}</select>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm leading-6 text-white"><input type="checkbox" checked={includeAffiliate} onChange={(event) => { setIncludeAffiliate(event.target.checked); setNewsletter(null); setHtml(""); }} className="mt-1" /><span>Include one relevant, clearly disclosed affiliate recommendation</span></label>
        <div className="mt-5 text-sm font-bold text-[var(--brand-gold)]">Recipes · {selectedSlugs.length}/5 selected</div>
        <div className="mt-2 max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {recipes.map((recipe) => <button key={recipe.slug} onClick={() => toggleRecipe(recipe.slug)} className={`w-full rounded-xl border p-3 text-left ${selectedSlugs.includes(recipe.slug) ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10" : "border-[var(--border)] bg-black/15"}`}><div className="font-bold text-white">{recipe.title}</div><div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{recipe.description}</div></button>)}
        </div>
        <button disabled={loading || selectedSlugs.length === 0} onClick={generate} className="mt-6 w-full rounded-xl bg-[var(--brand-red)] px-5 py-4 font-extrabold text-white disabled:opacity-50">{loading ? "Working…" : "Generate newsletter"}</button>
        {status ? <div className="mt-4 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm leading-6 text-[var(--text-soft)]">{status}{resultUrl ? <a href={resultUrl} target="_blank" rel="noreferrer" className="mt-2 block font-bold text-sky-300">Open in Kit →</a> : null}</div> : null}
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">2. Review and edit</h2>
        {!newsletter ? <div className="mt-5 flex min-h-[560px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-black/20 p-8 text-center text-[var(--text-soft)]">Select recipes and generate a newsletter to begin.</div> : <div className="mt-5 grid gap-7 xl:grid-cols-[minmax(320px,1fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <Field label="Subject" value={newsletter.subject} onChange={(value) => update("subject", value)} />
            <Field label="Inbox preview text" value={newsletter.previewText} onChange={(value) => update("previewText", value)} />
            <Field label="Introduction" value={newsletter.introduction} multiline onChange={(value) => update("introduction", value)} />
            {newsletter.recipes.map((recipe, index) => <div key={recipe.slug} className="rounded-2xl border border-[var(--border)] bg-black/15 p-4"><div className="mb-3 text-sm font-extrabold text-[var(--brand-gold)]">{selectedRecipes.find((item) => item.slug === recipe.slug)?.title || recipe.heading}</div><Field label="Heading" value={recipe.heading} onChange={(value) => updateRecipe(index, "heading", value)} /><div className="mt-3"><Field label="Description" value={recipe.description} multiline onChange={(value) => updateRecipe(index, "description", value)} /></div><div className="mt-3"><Field label="Link wording" value={recipe.cta} onChange={(value) => updateRecipe(index, "cta", value)} /></div></div>)}
            <div className="rounded-2xl border border-[var(--border)] bg-black/15 p-4"><div className="mb-3 text-sm font-extrabold text-[var(--brand-gold)]">Included guide</div><Field label="Heading" value={newsletter.guide.heading} onChange={(value) => update("guide", { ...newsletter.guide, heading: value })} /><div className="mt-3"><Field label="What readers will learn" value={newsletter.guide.description} multiline onChange={(value) => update("guide", { ...newsletter.guide, description: value })} /></div><div className="mt-3"><Field label="Link wording" value={newsletter.guide.cta} onChange={(value) => update("guide", { ...newsletter.guide, cta: value })} /></div></div>
            {newsletter.affiliate ? <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"><div className="text-sm font-extrabold text-amber-300">Affiliate recommendation</div><div className="mt-2 font-bold text-white">{newsletter.affiliate.title}</div><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{newsletter.affiliate.description}</p><p className="mt-2 text-xs text-amber-200">The tracking link and affiliate disclosure are added automatically.</p></div> : null}
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Tip heading" value={newsletter.tipTitle} onChange={(value) => update("tipTitle", value)} /><Field label="Cooking tip" value={newsletter.tipBody} multiline onChange={(value) => update("tipBody", value)} /></div>
            <Field label="Closing" value={newsletter.closing} multiline onChange={(value) => update("closing", value)} />
            <Field label="Postscript" value={newsletter.postscript} multiline onChange={(value) => update("postscript", value)} />
          </div>
          <div className="h-fit xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">{html ? <iframe title="Newsletter preview" srcDoc={html} className="h-[720px] w-full" /> : <div className="flex h-[360px] items-center justify-center bg-neutral-100 p-8 text-center text-neutral-600">Copy changed. Refresh the preview to see the latest version.</div>}</div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">The final Kit template adds the legal footer and unsubscribe links. Create a draft for Kit&apos;s exact inbox rendering preview.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><button disabled={loading} onClick={refreshHtml} className="rounded-xl border border-[var(--border)] px-5 py-3 font-bold text-white disabled:opacity-50">Refresh preview</button><button disabled={loading} onClick={createBroadcastDraft} className="rounded-xl border border-[var(--brand-gold)] px-5 py-3 font-bold text-[var(--brand-gold)] disabled:opacity-50">Create Kit draft</button></div>
          </div>
        </div>}
      </section>
    </div>

    {newsletter ? <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Final approval</div><h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">3. Schedule or send through Kit</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div><label className="text-sm font-bold text-[var(--brand-gold)]">Action</label><select value={sendMode} onChange={(event) => { setSendMode(event.target.value as typeof sendMode); setConfirmed(false); }} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white"><option value="draft">Save another draft</option><option value="schedule">Schedule email</option><option value="send">Send now</option></select></div>
        {sendMode === "schedule" ? <div><label className="text-sm font-bold text-[var(--brand-gold)]">Send time</label><input type="datetime-local" value={sendAt} onChange={(event) => { setSendAt(event.target.value); setConfirmed(false); }} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white" /></div> : <div className="rounded-xl bg-black/20 p-4"><div className="text-xs text-[var(--text-soft)]">Audience</div><div className="mt-1 text-xl font-extrabold text-white">All {kit.subscribers ?? "—"} active subscribers</div></div>}
        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm text-white"><input type="checkbox" checked={publishToWeb} onChange={(event) => setPublishToWeb(event.target.checked)} />Also publish on the Kit newsletter site</label>
      </div>
      {sendMode !== "draft" ? <label className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>I have reviewed the subject, copy, links and images, and confirm delivery to all <strong>{kit.subscribers ?? "current"} subscribers</strong>{sendMode === "send" ? " now" : ` at ${new Date(sendAt).toLocaleString("en-GB")}`}.</span></label> : null}
      <button disabled={loading || (sendMode !== "draft" && !confirmed) || kit.subscribers === null} onClick={sendMode === "draft" ? createBroadcastDraft : publish} className="mt-5 w-full rounded-xl bg-[var(--brand-red)] px-5 py-4 font-extrabold text-white disabled:opacity-50">{sendMode === "draft" ? "Create Kit draft" : sendMode === "send" ? `Send to ${kit.subscribers ?? 0} subscribers now` : "Schedule newsletter"}</button>
    </section> : null}

    <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Hands-free publishing</div><h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">Newsletter schedule</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">At the chosen time, Vegan Masala selects a fresh rotation of real recipes, writes the branded newsletter, checks Kit&apos;s live audience and sends it to every active subscriber. A lock prevents duplicate sends.</p></div>
        <div className={`rounded-full px-4 py-2 text-sm font-extrabold ${automation.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-[var(--text-soft)]"}`}>{automation.enabled ? "Active" : "Paused"}</div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm font-bold text-[var(--brand-gold)]">First delivery<input type="datetime-local" value={isoToLocalDateTime(automation.startAt)} onChange={(event) => changeAutomation("startAt", new Date(event.target.value).toISOString())} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white" /></label>
        <label className="text-sm font-bold text-[var(--brand-gold)]">Frequency<select value={automation.cadenceWeeks} onChange={(event) => changeAutomation("cadenceWeeks", Number(event.target.value) as 1 | 2)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white"><option value={1}>Every week</option><option value={2}>Every two weeks</option></select></label>
        <label className="text-sm font-bold text-[var(--brand-gold)]">Send day<select value={automation.weekday} onChange={(event) => changeAutomation("weekday", Number(event.target.value))} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white">{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        <label className="text-sm font-bold text-[var(--brand-gold)]">UK send time<input type="time" value={`${String(automation.hour).padStart(2, "0")}:${String(automation.minute).padStart(2, "0")}`} onChange={(event) => { const [hour, minute] = event.target.value.split(":").map(Number); setAutomation((current) => ({ ...current, hour, minute })); setAutomationConfirmed(false); }} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white" /></label>
        <label className="text-sm font-bold text-[var(--brand-gold)]">Recipes per email<select value={automation.recipeCount} onChange={(event) => changeAutomation("recipeCount", Number(event.target.value))} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white">{[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
      </div>
      <label className="mt-5 block text-sm font-bold text-[var(--brand-gold)]">Recurring theme or editorial direction<input value={automation.theme} onChange={(event) => changeAutomation("theme", event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 font-normal text-white" /></label>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm text-white"><input type="checkbox" checked={automation.publishToWeb} onChange={(event) => changeAutomation("publishToWeb", event.target.checked)} />Also publish each edition on the Kit newsletter site</label>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm text-white"><input type="checkbox" checked={automation.includeAffiliate} onChange={(event) => changeAutomation("includeAffiliate", event.target.checked)} />Include one contextual, disclosed affiliate recommendation</label>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm text-white md:col-span-2"><input type="checkbox" checked={automation.enabled} onChange={(event) => changeAutomation("enabled", event.target.checked)} />Enable automatic generation and delivery</label>
      </div>
      {automation.enabled ? <label className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100"><input type="checkbox" checked={automationConfirmed} onChange={(event) => setAutomationConfirmed(event.target.checked)} className="mt-1" /><span>I understand that this schedule will automatically generate and send a new email to <strong>all active Kit subscribers</strong> without a manual review each time.</span></label> : null}
      <button disabled={savingAutomation || !automationStorage || (automation.enabled && !automationConfirmed)} onClick={saveAutomation} className="mt-5 w-full rounded-xl bg-[var(--brand-red)] px-5 py-4 font-extrabold text-white disabled:opacity-50">{savingAutomation ? "Saving…" : automation.enabled ? "Save and activate schedule" : "Save paused schedule"}</button>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm leading-6 text-[var(--text-soft)]"><div>{automationStatus}</div>{automationState.lastSentAt ? <div className="mt-2">Last sent {new Date(automationState.lastSentAt).toLocaleString("en-GB")} to {automationState.lastRecipientCount ?? "the current"} subscribers{automationState.lastSubject ? ` · ${automationState.lastSubject}` : ""}.</div> : <div className="mt-2">No automated newsletter has been sent yet.</div>}{automationState.lastError ? <div className="mt-2 text-rose-300">Last error: {automationState.lastError}</div> : null}</div>
    </section>

    <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8"><h2 className="text-xl font-extrabold text-[var(--brand-gold)]">Recent Kit broadcasts</h2><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{kit.broadcasts?.length ? kit.broadcasts.map((broadcast) => <a key={broadcast.id} href={`https://app.kit.com/campaigns/${broadcast.id}/draft`} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--border)] bg-black/20 p-5"><div className="font-bold text-white">{broadcast.subject || "Untitled broadcast"}</div><div className="mt-2 text-xs text-[var(--text-soft)]">{broadcast.send_at ? `Scheduled ${new Date(broadcast.send_at).toLocaleString("en-GB")}` : `Draft · ${broadcast.created_at ? new Date(broadcast.created_at).toLocaleDateString("en-GB") : "recent"}`}</div></a>) : <p className="text-sm text-[var(--text-soft)]">No recent broadcasts were returned by Kit.</p>}</div></section>
  </main>;
}

function Field({ label, value, multiline = false, onChange }: { label: string; value: string; multiline?: boolean; onChange: (value: string) => void }) {
  const classes = "mt-2 w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-white";
  return <label className="block text-sm font-bold text-[var(--brand-gold)]">{label}{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${classes} min-h-28 font-normal leading-6`} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={`${classes} font-normal`} />}</label>;
}
