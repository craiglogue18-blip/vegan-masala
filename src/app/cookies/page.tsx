// src/app/cookies/page.tsx
export const metadata = {
  title: "Cookie Policy",
  description: "Cookie policy for Vegan Masala.",
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">
        Cookie Policy
      </h1>

      <p className="mt-6 text-[var(--text-soft)] leading-7">
        Last updated: 19 August 2026
      </p>

      <section className="mt-10 space-y-6 text-[var(--text-soft)] leading-7">
        <p>
          This Cookie Policy explains what cookies are, how Vegan Masala uses them,
          and how you can control them.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          What are cookies?
        </h2>
        <p className="mt-6 text-[var(--text-soft)] leading-7">
          Cookies are small text files stored on your device when you visit a
          website. They help websites work properly and can provide information to
          website owners about how the site is used.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Cookies we use
        </h2>

        <div className="mt-6 space-y-6 text-[var(--text-soft)] leading-7">
          <div>
            <h3 className="font-extrabold text-[var(--brand-gold)]">
              Essential cookies
            </h3>
            <p className="mt-2">
              These cookies are necessary for the website to function (for example,
              security and basic navigation). The site cannot work properly without
              them.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-[var(--brand-gold)]">
              Analytics cookies (optional)
            </h3>
            <p className="mt-2">
              These help us understand how visitors use the site (for example,
              which pages are most popular). We use this to improve recipes and
              content. Analytics cookies should be treated as optional.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-[var(--brand-gold)]">
              Functional cookies (optional)
            </h3>
            <p className="mt-2">
              These remember your preferences (for example, settings or display
              choices) to improve your experience.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-[var(--brand-gold)]">
              Advertising cookies (optional)
            </h3>
            <p className="mt-2">
              Following approval, Google AdSense and its partners may use cookies or
              similar technologies to deliver and measure adverts, prevent fraud and
              limit how often an advert is shown. With your permission, these may also
              be used to personalise advertising. If you decline, eligible adverts may
              be non-personalised or limited.
            </p>
            <p className="mt-2">
              With your permission, the Meta Pixel also measures visits and completed
              dinner-plan registrations so we can understand whether our Facebook and
              Instagram advertising is effective. The Meta Pixel is not activated
              unless the consent message reports the required advertising consent.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Managing cookies
        </h2>

        <div className="mt-6 space-y-4 text-[var(--text-soft)] leading-7">
          <p>
            You can control cookies in your browser settings. You can delete
            existing cookies and choose to block future cookies.
          </p>
          <p>
            Blocking some cookies may impact your experience and parts of the site
            may not function as intended.
          </p>
          <p>
            Visitors shown our consent message can choose “Consent”, “Do not consent”
            or “Manage options”. You can change your decision later through the site&apos;s
            privacy controls. Browser controls can also block or delete cookies, but
            they do not replace choices made through the consent message.
          </p>
          <p>
            If the main consent platform is unavailable, Vegan Masala shows a limited
            first-party choice specifically for Meta advertising measurement. That
            choice can be revisited using “Privacy choices” in the site footer.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Contact
        </h2>
        <p className="mt-6 text-[var(--text-soft)] leading-7">
          Questions? Contact: hello@vegan-masala.com
        </p>
      </section>
    </main>
  );
}
