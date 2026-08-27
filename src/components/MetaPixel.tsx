"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PIXEL_ID = "1942268053118106";
const CONSENT_POLL_INTERVAL_MS = 250;
const CONSENT_POLL_LIMIT = 40;
const FALLBACK_CONSENT_POLL_COUNT = 12;
const REGISTRATION_EVENT = "vegan-masala:complete-registration";
const OPEN_PRIVACY_CHOICES_EVENT = "vegan-masala:open-privacy-choices";
const REGISTRATION_STORAGE_KEY =
  "vegan-masala:complete-registration:7-day-dinner-plan:v1";
const CONSENT_STORAGE_KEY = "vegan-masala:advertising-consent:v1";
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
  const [showFallbackConsent, setShowFallbackConsent] = useState(false);
  const listenerId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (pathname.startsWith("/meal-planner")) return;
    let cancelled = false;
    let pollCount = 0;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const applyAdvertisingConsent = (granted: boolean) => {
      if (granted) {
        initialisePixel();
        window.fbq?.("consent", "grant");
        setReady(true);
        trackRegistrationOnce();
      } else {
        window.fbq?.("consent", "revoke");
        setReady(false);
      }
    };

    const applyFallbackChoice = () => {
      const choice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (choice === "granted" || choice === "denied") {
        applyAdvertisingConsent(choice === "granted");
      } else {
        setShowFallbackConsent(true);
      }
    };

    const handleConsent = (data: TcfApiData, success: boolean) => {
      if (!success || cancelled) return;
      if (typeof data.listenerId === "number") listenerId.current = data.listenerId;

      const consentResolved =
        data.eventStatus === "tcloaded" || data.eventStatus === "useractioncomplete";
      if (!consentResolved) return;

      setShowFallbackConsent(false);
      if (hasAdvertisingConsent(data)) {
        applyAdvertisingConsent(true);
      } else {
        applyAdvertisingConsent(false);
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
        if (subscribe()) {
          clearInterval(pollTimer);
        } else if (pollCount === FALLBACK_CONSENT_POLL_COUNT) {
          applyFallbackChoice();
        } else if (pollCount >= CONSENT_POLL_LIMIT) {
          clearInterval(pollTimer);
        }
      }, CONSENT_POLL_INTERVAL_MS);
    }

    const handleRegistration = () => trackRegistrationOnce();
    const openPrivacyChoices = () => setShowFallbackConsent(true);
    window.addEventListener(REGISTRATION_EVENT, handleRegistration);
    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, openPrivacyChoices);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener(REGISTRATION_EVENT, handleRegistration);
      window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, openPrivacyChoices);
      if (window.__tcfapi && listenerId.current !== undefined) {
        window.__tcfapi("removeEventListener", 2, () => undefined, listenerId.current);
      }
    };
  }, [pathname]);

  const saveFallbackConsent = (granted: boolean) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, granted ? "granted" : "denied");
    setShowFallbackConsent(false);

    if (granted) {
      initialisePixel();
      window.fbq?.("consent", "grant");
      setReady(true);
      trackRegistrationOnce();
    } else {
      window.fbq?.("consent", "revoke");
      setReady(false);
    }
  };

  useEffect(() => {
    window.__vmDinnerPlanRegistrationRequested = pathname === CONFIRMATION_PATH;
    if (window.__vmDinnerPlanRegistrationRequested) {
      window.dispatchEvent(new Event(REGISTRATION_EVENT));
    }

    if (!ready || !window.fbq) return;
    window.fbq("track", "PageView");
    trackRegistrationOnce();
  }, [pathname, ready]);

  if (pathname.startsWith("/meal-planner") || !showFallbackConsent) return null;

  return (
    <aside
      aria-label="Advertising cookie choices"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-black p-5 text-white shadow-2xl sm:p-6"
    >
      <h2 className="text-lg font-extrabold text-[var(--brand-gold)]">
        Your privacy choices
      </h2>
      <p className="mt-2 leading-6 text-[var(--text-soft)]">
        May we use advertising cookies to measure whether our Facebook and Instagram
        promotions lead to dinner-plan registrations? Declining will not affect your
        download.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => saveFallbackConsent(true)}
          className="rounded-full bg-[var(--brand-gold)] px-5 py-3 font-extrabold text-black"
        >
          Allow advertising cookies
        </button>
        <button
          type="button"
          onClick={() => saveFallbackConsent(false)}
          className="rounded-full border border-[var(--border)] px-5 py-3 font-bold text-white"
        >
          Decline
        </button>
      </div>
    </aside>
  );
}

export { REGISTRATION_EVENT };
