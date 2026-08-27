"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function PwaManager() {
  const [online, setOnline] = useState(true);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const refreshing = useRef(false);

  useEffect(() => {
    const initialStatus = window.setTimeout(() => setOnline(navigator.onLine), 0);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onControllerChange = () => {
      if (refreshing.current) return;
      refreshing.current = true;
      window.location.reload();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        if (registration.waiting) setWaitingWorker(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(worker);
          });
        });
      }).catch(() => undefined);

      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    return () => {
      window.clearTimeout(initialStatus);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (online && !waitingWorker) return null;

  return <div className="fixed inset-x-4 top-20 z-[75] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[#10191e]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur" role="status">
    {!online ? <><span className="inline-flex items-center gap-2 font-bold text-[var(--brand-gold)]"><CloudOff aria-hidden="true" size={18} /> Offline mode</span><span className="text-xs text-[var(--text-soft)]">Saved screens still work</span></> : <><span className="font-bold text-white">An app update is ready</span><button type="button" onClick={() => waitingWorker?.postMessage({ type: "SKIP_WAITING" })} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-gold)] px-3 py-1.5 text-xs font-extrabold text-black"><RefreshCw aria-hidden="true" size={14} /> Update</button></>}
  </div>;
}
