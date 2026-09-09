"use client";

import { useEffect, useRef, type MouseEventHandler, type ReactNode } from "react";
import { recordEngagement } from "@/lib/dinner-plan-tracking";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type AffiliateLinkProps = {
  href: string;
  title: string;
  category: string;
  network?: string;
  destinationLabel?: string;
  placement?: string;
  className?: string;
  children: ReactNode;
};

export default function AffiliateLink({
  href,
  title,
  category,
  network = "Amazon UK",
  destinationLabel = network,
  placement,
  className,
  children,
}: AffiliateLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const element = linkRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    let recorded = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!recorded && entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
        recorded = true;
        recordEngagement("affiliate_impression", { category, product: title, placement, source: network });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [category, network, placement, title]);

  const trackClick: MouseEventHandler<HTMLAnchorElement> = () => {
    const event = {
      affiliate_network: network,
      affiliate_product: title,
      affiliate_category: category,
      affiliate_placement: placement,
      destination_url: href,
      page_path: window.location.pathname,
    };

    window.dataLayer?.push({ event: "affiliate_click", ...event });
    window.fbq?.("trackCustom", "AffiliateClick", event);
    recordEngagement("affiliate_click", {
      category,
      product: title,
      placement,
      source: network,
    });
  };

  return (
    <a
      ref={linkRef}
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      className={className}
      aria-label={`View ${title} at ${destinationLabel} — paid affiliate link`}
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
