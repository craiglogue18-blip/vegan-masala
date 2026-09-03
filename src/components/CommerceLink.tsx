"use client";

import type { MouseEventHandler, ReactNode } from "react";

import { recordEngagement } from "@/lib/dinner-plan-tracking";

type CommerceLinkProps = {
  href: string;
  product: string;
  placement: string;
  value?: number;
  className?: string;
  children: ReactNode;
};

export default function CommerceLink({
  href,
  product,
  placement,
  value = 5,
  className,
  children,
}: CommerceLinkProps) {
  const trackClick: MouseEventHandler<HTMLAnchorElement> = () => {
    const event = {
      ecommerce_product: product,
      ecommerce_placement: placement,
      value,
      currency: "GBP",
      destination_url: href,
      page_path: window.location.pathname,
    };

    window.dataLayer?.push({ event: "begin_checkout", ...event });
    window.fbq?.("track", "InitiateCheckout", {
      content_name: product,
      content_type: "product",
      currency: "GBP",
      value,
    });
    recordEngagement("commerce_click", { product, placement, source: "payhip" });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
