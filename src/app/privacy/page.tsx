// src/app/privacy/page.tsx
export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Vegan Masala.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">
        Privacy Policy
      </h1>

      <p className="mt-6 text-[var(--text-soft)] leading-7">
        Last updated: 19 August 2026
      </p>

      {/* INTRO */}
      <section className="mt-10 space-y-6 text-[var(--text-soft)] leading-7">
        <p>
          This website (“Vegan Masala”, “we”, “our”, “us”) is committed to protecting
          your privacy. This policy explains what information we collect, how we use
          it, and your rights under UK and GDPR privacy law.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Meta advertising measurement
        </h2>

        <div className="mt-6 space-y-4 text-[var(--text-soft)] leading-7">
          <p>
            With your permission, Vegan Masala uses the Meta Pixel to measure page
            visits and completed dinner-plan registrations from Facebook and Instagram
            advertising. This helps us assess campaign performance and avoid wasting
            advertising spend.
          </p>
          <p>
            The Meta Pixel is activated only when the site&apos;s consent platform reports
            the required advertising consent. Meta may process limited device, browser,
            page and interaction information under its own privacy terms.
          </p>
        </div>
      </section>

      {/* INFORMATION WE COLLECT */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Information we collect
        </h2>

        <div className="mt-6 space-y-6 text-[var(--text-soft)] leading-7">
          <p>We may collect the following types of information:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              Contact details you provide voluntarily (for example when using the
              contact form).
            </li>
            <li>
              Anonymous usage data such as pages visited and time spent on the
              website.
            </li>
            <li>
              Technical information such as browser type, device type and country.
            </li>
            <li>
              Advertising information such as ad impressions, interactions and
              consent choices when advertising is enabled.
            </li>
          </ul>
        </div>
      </section>

      {/* HOW WE USE DATA */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          How we use your information
        </h2>

        <div className="mt-6 space-y-4 text-[var(--text-soft)] leading-7">
          <p>We use information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Respond to enquiries and messages</li>
            <li>Improve website content and recipes</li>
            <li>Understand how visitors use the site</li>
            <li>Maintain website security</li>
          </ul>
        </div>
      </section>

      {/* COOKIES */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Cookies & analytics
        </h2>

        <p className="mt-6 text-[var(--text-soft)] leading-7">
          This website uses cookies and similar technologies for essential functions,
          analytics and, following approval, advertising. Optional technologies are
          controlled through the consent message shown to eligible visitors.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Advertising and Google AdSense
        </h2>

        <div className="mt-6 space-y-4 text-[var(--text-soft)] leading-7">
          <p>
            Vegan Masala may use Google AdSense to fund its free recipes and guides.
            Google and its advertising partners may use cookies or similar technologies
            to deliver, measure and limit the repetition of adverts. Depending on your
            consent and location, adverts may be personalised or based on the content of
            the page you are viewing.
          </p>
          <p>
            Visitors in the UK, EEA and Switzerland can accept, refuse or manage
            advertising choices through Google&apos;s certified consent platform. You can
            revisit those choices through the privacy controls provided on the site.
          </p>
          <p>
            Learn more about how Google uses information from sites that use its
            services on the{" "}
            <a
              href="https://business.safety.google/privacy/"
              className="underline hover:text-[var(--brand-gold)]"
            >
              Google Business Data Responsibility site
            </a>
            .
          </p>
        </div>
      </section>

      {/* DATA SHARING */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Sharing your data
        </h2>

        <p className="mt-6 text-[var(--text-soft)] leading-7">
          We do not sell, trade, or rent your personal data. We may share limited
          data with trusted services that help operate the website, including hosting,
          analytics, consent-management and advertising providers. These providers may
          process data in other countries using appropriate legal safeguards.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Connected social-media accounts
        </h2>

        <div className="mt-6 space-y-4 text-[var(--text-soft)] leading-7">
          <p>
            Vegan Masala administrators may connect authorised social-media accounts,
            including TikTok and YouTube, to prepare and publish Vegan Masala content.
            We process the account identifiers and renewable authorisation tokens needed
            to maintain those connections and do not sell that information.
          </p>
          <p>
            The account owner can revoke a connection through the relevant social
            platform or by contacting hello@vegan-masala.com.
          </p>
        </div>
      </section>

      {/* YOUR RIGHTS */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Your rights
        </h2>

        <div className="mt-6 space-y-4 text-[var(--text-soft)] leading-7">
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request a copy of any personal data we hold</li>
            <li>Request correction or deletion of your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </div>
      </section>

      {/* CONTACT */}
      <section className="mt-12">
        <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
          Contact
        </h2>

        <p className="mt-6 text-[var(--text-soft)] leading-7">
          For privacy questions, contact: hello@vegan-masala.com
        </p>
      </section>
    </main>
  );
}
