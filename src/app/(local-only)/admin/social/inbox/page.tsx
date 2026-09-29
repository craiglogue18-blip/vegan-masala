"use client";

import { ExternalLink, Inbox, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Platform = "facebook" | "instagram" | "youtube";
type Item = { id: string; platform: Platform; author: string; text: string; createdAt: string; contentTitle: string; contentUrl: string; replied: boolean; replyCount: number };
type Connection = { platform: Platform; ok: boolean; count: number; error?: string };

const platformStyle: Record<Platform, string> = {
  facebook: "bg-blue-500/15 text-blue-200 border-blue-400/30",
  instagram: "bg-pink-500/15 text-pink-200 border-pink-400/30",
  youtube: "bg-red-500/15 text-red-200 border-red-400/30",
};

export default function SocialInboxPage() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filter, setFilter] = useState<"all" | Platform | "unanswered">("all");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Ready to refresh");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState("");

  useEffect(() => { setToken(localStorage.getItem("vm_admin_token") || ""); }, []);

  async function load() {
    setLoading(true); setStatus("Checking connected inboxes…");
    try {
      localStorage.setItem("vm_admin_token", token.trim());
      const response = await fetch("/api/admin/social/inbox", { headers: { "x-admin-token": token.trim() }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inbox could not be loaded");
      setItems(data.items || []); setConnections(data.connections || []);
      setStatus(`Updated ${new Date(data.refreshedAt).toLocaleTimeString()} · ${data.items?.length || 0} comments`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Inbox could not be loaded"); }
    finally { setLoading(false); }
  }

  async function reply(item: Item) {
    const message = (drafts[item.id] || "").trim();
    if (!message) return;
    setSending(item.id); setStatus(`Sending reply to ${item.author}…`);
    try {
      const response = await fetch("/api/admin/social/inbox", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token.trim() }, body: JSON.stringify({ platform: item.platform, commentId: item.id, message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reply failed");
      setDrafts((current) => ({ ...current, [item.id]: "" }));
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, replied: true, replyCount: entry.replyCount + 1 } : entry));
      setStatus("Reply sent successfully");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Reply failed"); }
    finally { setSending(""); }
  }

  const visible = useMemo(() => items.filter((item) => {
    if (filter === "unanswered" && item.replied) return false;
    if (["facebook", "instagram", "youtube"].includes(filter) && item.platform !== filter) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${item.author} ${item.text} ${item.contentTitle}`.toLowerCase().includes(needle);
  }), [filter, items, query]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 text-white sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Admin · Social</p><h1 className="mt-2 flex items-center gap-3 text-4xl font-extrabold"><Inbox aria-hidden="true" /> Unified Inbox</h1><p className="mt-3 max-w-3xl text-[var(--text-soft)]">Review Facebook, Instagram and YouTube comments and send deliberate, human-approved replies from one place.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-extrabold disabled:opacity-50"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh inboxes</button></div>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-black/40 p-5"><label className="text-sm font-bold text-[var(--brand-gold)]">Admin token</label><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Required on the live site" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3" /><p role="status" className="mt-3 text-sm text-[var(--text-soft)]">{status}</p></section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">{connections.map((connection) => <article key={connection.platform} className={`rounded-2xl border p-4 ${connection.ok ? platformStyle[connection.platform] : "border-amber-400/30 bg-amber-500/10 text-amber-100"}`}><p className="font-extrabold capitalize">{connection.platform}</p><p className="mt-1 text-sm">{connection.ok ? `${connection.count} recent comments loaded` : connection.error}</p></article>)}</section>

      <section className="mt-8 flex flex-wrap gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search comments or people" className="min-w-64 flex-1 rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3" />{(["all", "unanswered", "facebook", "instagram", "youtube"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${filter === value ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)]"}`}>{value}</button>)}</section>

      <section className="mt-7 space-y-5">{visible.map((item) => <article key={`${item.platform}-${item.id}`} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${platformStyle[item.platform]}`}>{item.platform}</span><h2 className="mt-3 text-xl font-extrabold">{item.author}</h2><p className="mt-1 text-xs text-[var(--text-soft)]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"} · {item.replied ? "Replied" : "Needs reply"}</p></div><a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-gold)]">Open post <ExternalLink size={15} /></a></div><blockquote className="mt-5 rounded-xl border-l-4 border-[var(--brand-gold)] bg-black/35 p-4 text-lg leading-8">{item.text || "Comment contains no text."}</blockquote><p className="mt-3 line-clamp-2 text-sm text-[var(--text-soft)]">On: {item.contentTitle}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><textarea value={drafts[item.id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1000} rows={2} placeholder={`Reply to ${item.author}`} className="min-h-20 flex-1 rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3" /><button type="button" onClick={() => void reply(item)} disabled={sending === item.id || !(drafts[item.id] || "").trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-3 font-extrabold text-black disabled:opacity-40"><Send size={17} /> {sending === item.id ? "Sending…" : "Send reply"}</button></div></article>)}{!visible.length && <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--text-soft)]">No comments match this view. Refresh the inbox or change the filters.</div>}</section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2"><a href="https://www.tiktok.com/messages" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[var(--border)] bg-black/40 p-5 font-bold text-[var(--brand-gold)]">Open TikTok inbox ↗<span className="mt-2 block text-sm font-normal text-[var(--text-soft)]">TikTok does not expose a supported creator comment inbox API.</span></a><a href="https://www.pinterest.com/business/hub/" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[var(--border)] bg-black/40 p-5 font-bold text-[var(--brand-gold)]">Open Pinterest Business Hub ↗<span className="mt-2 block text-sm font-normal text-[var(--text-soft)]">Pinterest does not expose comments or messages through its current public API.</span></a></section>
    </main>
  );
}
