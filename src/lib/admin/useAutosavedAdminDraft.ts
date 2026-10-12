"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps unfinished admin form work in this browser only. It deliberately stores
 * no credentials, tokens or generated account data.
 */
export function useAutosavedAdminDraft<T>(
  key: string,
  value: T,
  restore: (value: Partial<T>) => void
) {
  const [hydrated, setHydrated] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const serialized = JSON.stringify(value);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`vegan-masala-admin-draft:${key}`);
      if (saved) restoreRef.current(JSON.parse(saved) as Partial<T>);
    } catch {
      // A corrupt or unavailable browser draft must never block the admin tool.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(`vegan-masala-admin-draft:${key}`, serialized);
  }, [hydrated, key, serialized]);

  return hydrated;
}
