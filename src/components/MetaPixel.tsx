"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PIXEL_ID = "1942268053118106";
const CONSENT_POLL_INTERVAL_MS = 250;
const CONSENT_POLL_LIMIT = 40;
const REGISTRATION_EVENT = "vegan-masala:complete-registration";
const REGISTRATION_STORAGE_KEY =
  "vegan-masala:complete-registration:7-day-dinner-plan:v1";
const CONFIRMATION_PATH = "/dinner-plan/confirmed";

function hasAdvertisingConsent(data: TcfApiData) {
  if (data.gdprApplies === false) return true;

  const purposes = data.purpose?.consents;
  return Boolean(purposes?.["1"] && purposes?.["3"] && purposes?.["4"]);
}

function initialisePixel() {
  if (window.fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as MetaPixelFunction;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", PIXEL_ID);
}

function trackRegistrationOnce() {
  if (!window.fbq || !window.__vmDinnerPlanRegistrationRequested) return;
  if (window.sessionStorage.getItem(REGISTRATION_STORAGE_KEY)) return;

  window.sessionStorage.setItem(REGISTRATION_STORAGE_KEY, "true");
  window.fbq("track", "CompleteRegistration", {
    content_name: "7-Day Vegan Indian Dinner Plan",
    status: true,
  });
}

export default function MetaPixel() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const listenerId = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let pollCount = 0;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const handleConsent = (data: TcfApiData, success: boolean) => {
      if (!success || cancelled) return;
      if (typeof data.listenerId === "number") listenerId.current = data.listenerId;

      const consentResolved =
        data.eventStatus === "tcloaded" || data.eventStatus === "useractioncomplete";
      if (!consentResolved) return;

      if (hasAdvertisingConsent(data)) {
        initialisePixel();
        window.fbq?.("consent", "grant");
        setReady(true);
        trackRegistrationOnce();
      } else {
        window.fbq?.("consent", "revoke");
        setReady(false);
      }
    };

    const subscribe = () => {
      if (!window.__tcfapi) return false;
      window.__tcfapi("addEventListener", 2, handleConsent);
      return true;
    };

    if (!subscribe()) {
      pollTimer = setInterval(() => {
        pollCount += 1;
        if (subscribe() || pollCount >= CONSENT_POLL_LIMIT) {
          clearInterval(pollTimer);
        }
      }, CONSENT_POLL_INTERVAL_MS);
    }

    const handleRegistration = () => trackRegistrationOnce();
    window.addEventListener(REGISTRATION_EVENT, handleRegistration);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener(REGISTRATION_EVENT, handleRegistration);
      if (window.__tcfapi && listenerId.current !== undefined) {
        window.__tcfapi("removeEventListener", 2, () => undefined, listenerId.current);
      }
    };
  }, []);

  useEffect(() => {
    window.__vmDinnerPlanRegistrationRequested = pathname === CONFIRMATION_PATH;
    if (window.__vmDinnerPlanRegistrationRequested) {
      window.dispatchEvent(new Event(REGISTRATION_EVENT));
    }

    if (!ready || !window.fbq) return;
    window.fbq("track", "PageView");
    trackRegistrationOnce();
  }, [pathname, ready]);

  return null;
}

export { REGISTRATION_EVENT };
