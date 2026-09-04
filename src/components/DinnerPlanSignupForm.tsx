"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDinnerPlanSignupId,
  DINNER_PLAN_COMPLETED_KEY,
  DINNER_PLAN_CONFIRMATION_RECORDED_KEY,
  DINNER_PLAN_PENDING_KEY,
  recordEngagement,
} from "@/lib/dinner-plan-tracking";

const KIT_FORM_ACTION = "https://app.kit.com/forms/9816369/subscriptions";

export function DinnerPlanSignupForm() {
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    recordEngagement("dinner_plan_view", {
      source: params.get("utm_source") || "direct",
      campaign: params.get("utm_campaign") || "none",
      placement: params.get("utm_content") || "dinner-plan-page",
    });
  }, []);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    recordEngagement("dinner_plan_form_start");
  };

  const prepareSignup = () => {
    const signupId = createDinnerPlanSignupId();
    window.localStorage.setItem(DINNER_PLAN_PENDING_KEY, signupId);
    window.localStorage.removeItem(DINNER_PLAN_COMPLETED_KEY);
    window.sessionStorage.removeItem(DINNER_PLAN_CONFIRMATION_RECORDED_KEY);
    recordEngagement("dinner_plan_form_submit");
    setSubmitting(true);
  };

  return (
    <form action={KIT_FORM_ACTION} method="post" onSubmit={prepareSignup} className="mt-7">
      <label htmlFor="dinner-plan-email" className="block text-sm font-bold text-white">
        Where should we send your free plan?
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="dinner-plan-email"
          name="email_address"
          type="email"
          autoComplete="email"
          required
          onFocus={markStarted}
          onInput={markStarted}
          onPointerDown={markStarted}
          placeholder="you@example.com"
          className="min-h-12 flex-1 rounded-xl border border-[var(--border)] bg-black/35 px-4 text-white outline-none placeholder:text-white/45 focus:border-[var(--brand-gold)]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded-xl bg-[var(--brand-red)] px-6 font-extrabold text-white shadow transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? "Sending…" : "Send my free plan"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]/75">
        Free instant PDF. Occasional cooking inspiration. Unsubscribe at any time.
      </p>
    </form>
  );
}

export function DinnerPlanConfirmationTracker() {
  useEffect(() => {
    const signupId = window.localStorage.getItem(DINNER_PLAN_PENDING_KEY);
    if (!signupId) return;

    window.__vmDinnerPlanRegistrationRequested = true;
    window.__vmDinnerPlanRegistrationEventId = signupId;
    window.dispatchEvent(new Event("vegan-masala:complete-registration"));

    if (window.sessionStorage.getItem(DINNER_PLAN_CONFIRMATION_RECORDED_KEY) !== signupId) {
      recordEngagement("dinner_plan_confirmed");
      window.sessionStorage.setItem(DINNER_PLAN_CONFIRMATION_RECORDED_KEY, signupId);
    }
  }, []);

  return null;
}

export function DinnerPlanDownloadLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      onClick={() => recordEngagement("dinner_plan_download")}
      className="mt-8 inline-flex rounded-full bg-[var(--brand-gold)] px-7 py-4 text-base font-extrabold text-black transition hover:brightness-110"
      download="vegan-masala-7-day-dinner-plan.pdf"
    >
      Download the dinner plan
    </a>
  );
}
