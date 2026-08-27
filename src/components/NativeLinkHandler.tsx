"use client";

import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

const PRODUCTION_ORIGIN = "https://www.vegan-masala.com";

export default function NativeLinkHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const openWebsiteLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (!url.protocol.startsWith("http")) return;
      if (url.pathname.startsWith("/meal-planner")) return;

      event.preventDefault();
      const websiteUrl = ["localhost", "127.0.0.1"].includes(url.hostname)
        ? new URL(`${url.pathname}${url.search}${url.hash}`, PRODUCTION_ORIGIN).toString()
        : url.toString();
      void Browser.open({ url: websiteUrl });
    };

    document.addEventListener("click", openWebsiteLink);
    return () => document.removeEventListener("click", openWebsiteLink);
  }, []);

  return null;
}
