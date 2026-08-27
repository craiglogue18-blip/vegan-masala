"use client";

import { Check, Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const installedStatus = window.setTimeout(() => setInstalled(standalone), 0);
    return () => {
      window.clearTimeout(installedStatus);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (installed) return <span className="inline-flex items-center gap-2 rounded-xl border border-green-800/70 bg-green-950/40 px-4 py-2.5 text-sm font-extrabold text-green-300"><Check aria-hidden="true" size={18} /> Installed on this device</span>;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  }

  return (
    <div>
    <button type="button" onClick={() => promptEvent ? void install() : setShowHelp(true)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-gold)]/60 bg-black/20 px-4 py-2.5 text-sm font-extrabold text-[var(--brand-gold)] hover:bg-white/10">
      <Download aria-hidden="true" size={18} />
      Install Vegan Masala
    </button>
    {showHelp && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-5 backdrop-blur-sm" role="presentation" onClick={() => setShowHelp(false)}><section role="dialog" aria-modal="true" aria-labelledby="install-help-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[#10191e] p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]">Install the app</p><h2 id="install-help-title" className="mt-1 text-2xl">Add Vegan Masala to your home screen</h2></div><button type="button" onClick={() => setShowHelp(false)} aria-label="Close install instructions" className="rounded-xl border border-[var(--border)] p-2 text-[var(--text-soft)]"><X aria-hidden="true" size={19} /></button></div><div className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-soft)]"><p><strong className="text-white">iPhone or iPad:</strong> tap the browser&apos;s Share button, then choose <strong className="text-white">Add to Home Screen</strong>.</p><p><strong className="text-white">Android:</strong> open the browser menu and choose <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.</p><p><strong className="text-white">Desktop:</strong> look for the install icon in the address bar or choose Install from the browser menu.</p></div><button type="button" onClick={() => setShowHelp(false)} className="mt-6 w-full rounded-xl bg-[var(--brand-red)] px-5 py-3 font-extrabold text-white">Got it</button></section></div>}
    </div>
  );
}
