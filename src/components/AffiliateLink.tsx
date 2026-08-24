"use client";

import type { MouseEventHandler, ReactNode } from "react";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type AffiliateLinkProps = {
  href: string;
  title: string;
  category: string;
  className?: string;
  children: ReactNode;
};

export default function AffiliateLink({
  href,
  title,
  category,
  className,
  children,
}: AffiliateLinkProps) {
  const trackClick: MouseEventHandler<HTMLAnchorElement> = () => {
    const event = {
      affiliate_network: "Amazon UK",
      affiliate_product: title,
      affiliate_category: category,
      destination_url: href,
      page_path: window.location.pathname,
    };

    window.dataLayer?.push({ event: "affiliate_click", ...event });
    window.fbq?.("trackCustom", "AffiliateClick", event);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      className={className}
      aria-label={`View ${title} on Amazon UK — paid affiliate link`}
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
