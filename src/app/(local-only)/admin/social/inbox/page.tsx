"use client";

import { ExternalLink, Inbox, RefreshCw, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Platform = "facebook" | "instagram" | "youtube";
type Item = { kind?: "comment" | "message"; canReply?: boolean; id: string; platform: Platform; author: string; text: string; createdAt: string; contentTitle: string; contentUrl: string; replied: boolean; replyCount: number };
type Connection = { kind: "comments" | "messages"; platform: Platform; ok: boolean; count: number; error?: string };

const platformStyle: Record<Platform, string> = {
  facebook: "bg-blue-500/15 text-blue-200 border-blue-400/30",
  instagram: "bg-pink-500/15 text-pink-200 border-pink-400/30",
  youtube: "bg-red-500/15 text-red-200 border-red-400/30",
};

export default function SocialInboxPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filter, setFilter] = useState<"all" | Platform | "unanswered" | "messages" | "comments">("all");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading connected inboxes…");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState("");
  const [dismissing, setDismissing] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true); setStatus("Checking connected inboxes…");
    try {
      const response = await fetch("/api/admin/social/inbox", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inbox could not be loaded");
      setItems(data.items || []); setConnections(data.connections || []);
      setStatus(`Updated ${new Date(data.refreshedAt).toLocaleTimeString()} · ${data.items?.length || 0} comments and conversations`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Inbox could not be loaded"); }
    finally { setLoading(false); }
  }

  function removeItem(item: Item) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setItems((current) => current.filter((entry) => !(entry.platform === item.platform && entry.id === item.id && entry.kind === item.kind)));
    setConnections((current) => current.map((connection) => {
      const itemKind = item.kind === "message" ? "messages" : "comments";
      return connection.platform === item.platform && connection.kind === itemKind
        ? { ...connection, count: Math.max(0, connection.count - 1) }
        : connection;
    }));
  }

  async function reply(item: Item) {
    const message = (drafts[item.id] || "").trim();
    if (!message) return;
    setSending(item.id); setStatus(`Sending reply to ${item.author}…`);
    try {
      const response = await fetch("/api/admin/social/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform: item.platform, commentId: item.id, kind: item.kind, message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reply failed");
      removeItem(item);
      setStatus("Reply sent successfully · removed from inbox");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Reply failed"); }
    finally { setSending(""); }
  }

  async function dismiss(item: Item) {
    setDismissing(item.id); setStatus(`Dismissing ${item.author} from the inbox…`);
    try {
      const response = await fetch("/api/admin/social/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "dismiss", platform: item.platform, commentId: item.id, kind: item.kind }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Item could not be dismissed");
      removeItem(item);
      setStatus("Dismissed from this inbox · original message was not deleted");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Item could not be dismissed"); }
    finally { setDismissing(""); }
  }

  const visible = useMemo(() => items.filter((item) => {
    if (filter === "messages" && item.kind !== "message") return false;
    if (filter === "comments" && item.kind === "message") return false;
    if (filter === "unanswered" && item.replied) return false;
    if (["facebook", "instagram", "youtube"].includes(filter) && item.platform !== filter) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${item.author} ${item.text} ${item.contentTitle}`.toLowerCase().includes(needle);
  }), [filter, items, query]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 text-white sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Admin · Social</p><h1 className="mt-2 flex items-center gap-3 text-4xl font-extrabold"><Inbox aria-hidden="true" /> Unified Inbox</h1><p className="mt-3 max-w-3xl text-[var(--text-soft)]">Review public comments and recent Facebook and Instagram private conversations. Messages load when you open or refresh this page.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-extrabold disabled:opacity-50"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh inboxes</button></div>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-black/40 p-5"><p role="status" className="text-sm text-[var(--text-soft)]">{status}</p></section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">{connections.map((connection) => <article key={`${connection.platform}-${connection.kind}`} className={`rounded-2xl border p-4 ${connection.ok ? platformStyle[connection.platform] : "border-amber-400/30 bg-amber-500/10 text-amber-100"}`}><p className="font-extrabold capitalize">{connection.platform} {connection.kind}</p><p className="mt-1 text-sm">{connection.ok ? `${connection.count} ${connection.kind === "messages" ? "conversations" : "comments"} loaded` : connection.error}</p></article>)}</section>

      <section className="mt-8 flex flex-wrap gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search comments or people" className="min-w-64 flex-1 rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3" />{(["all", "unanswered", "messages", "comments", "facebook", "instagram", "youtube"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${filter === value ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)]"}`}>{value}</button>)}</section>

      <section className="mt-7 space-y-5">{visible.map((item) => <article key={`${item.platform}-${item.id}`} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${platformStyle[item.platform]}`}>{item.platform} · {item.kind === "message" ? "Private message" : "Comment"}</span><h2 className="mt-3 text-xl font-extrabold">{item.author}</h2><p className="mt-1 text-xs text-[var(--text-soft)]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"} · {item.replied ? "Replied" : "Needs reply"}</p></div><a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-gold)]">{item.kind === "message" ? "Open conversation" : "Open post"} <ExternalLink size={15} /></a></div><blockquote className="mt-5 rounded-xl border-l-4 border-[var(--brand-gold)] bg-black/35 p-4 whitespace-pre-wrap text-lg leading-8">{item.text || "Comment contains no text."}</blockquote><p className="mt-3 line-clamp-2 text-sm text-[var(--text-soft)]">On: {item.contentTitle}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><textarea value={drafts[item.id] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1000} rows={2} placeholder={`Reply to ${item.author}`} className="min-h-20 flex-1 rounded-xl border border-[var(--border)] bg-black/50 px-4 py-3" /><div className="flex gap-3 sm:flex-col"><button type="button" onClick={() => void reply(item)} disabled={item.canReply === false || sending === item.id || dismissing === item.id || !(drafts[item.id] || "").trim()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-3 font-extrabold text-black disabled:opacity-40"><Send size={17} /> {sending === item.id ? "Sending…" : "Send reply"}</button><button type="button" onClick={() => void dismiss(item)} disabled={sending === item.id || dismissing === item.id} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 font-extrabold text-[var(--text-soft)] hover:border-red-400/50 hover:text-red-200 disabled:opacity-40"><X size={17} /> {dismissing === item.id ? "Dismissing…" : "Dismiss"}</button></div></div></article>)}{!visible.length && <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--text-soft)]">No comments or conversations match this view. Refresh the inbox or change the filters.</div>}</section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2"><a href="https://www.tiktok.com/messages" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[var(--border)] bg-black/40 p-5 font-bold text-[var(--brand-gold)]">Open TikTok inbox ↗<span className="mt-2 block text-sm font-normal text-[var(--text-soft)]">TikTok does not expose a supported creator comment inbox API.</span></a><a href="https://www.pinterest.com/business/hub/" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[var(--border)] bg-black/40 p-5 font-bold text-[var(--brand-gold)]">Open Pinterest Business Hub ↗<span className="mt-2 block text-sm font-normal text-[var(--text-soft)]">Pinterest does not expose comments or messages through its current public API.</span></a></section>
    </main>
  );
}
