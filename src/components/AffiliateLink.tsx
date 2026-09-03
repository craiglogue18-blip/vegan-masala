"use client";

import type { MouseEventHandler, ReactNode } from "react";
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
