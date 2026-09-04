"use client";

import { useState } from "react";

export function AmazonReportImport() {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(formData: FormData) {
    setUploading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/amazon-report", { method: "POST", body: formData });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Upload failed");
      setMessage("Amazon report imported. Refreshing dashboard…");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Amazon report upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={upload} className="mt-3 flex flex-wrap items-center gap-3">
      <input
        type="file"
        name="report"
        accept=".csv,text/csv"
        required
        className="max-w-full text-xs text-[var(--text-soft)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--brand-gold)] file:px-4 file:py-2 file:font-bold file:text-black"
      />
      <button
        type="submit"
        disabled={uploading}
        className="rounded-full border border-[var(--brand-gold)]/45 px-4 py-2 text-xs font-bold text-[var(--brand-gold)] disabled:opacity-60"
      >
        {uploading ? "Importing…" : "Import report"}
      </button>
      {message && <p className="w-full text-xs text-[var(--text-soft)]">{message}</p>}
    </form>
  );
}
