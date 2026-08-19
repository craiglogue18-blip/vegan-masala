"use client";

const OPEN_PRIVACY_CHOICES_EVENT = "vegan-masala:open-privacy-choices";

export default function PrivacyChoicesButton() {
  return (
    <button
      type="button"
      className="hover:text-[var(--brand-gold)]"
      onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_CHOICES_EVENT))}
    >
      Privacy choices
    </button>
  );
}
