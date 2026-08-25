export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for Vegan Masala.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-[var(--brand-gold)]">
        Terms of Service
      </h1>

      <p className="mt-6 leading-7 text-[var(--text-soft)]">
        Last updated: 25 August 2026
      </p>

      <div className="mt-10 space-y-10 leading-7 text-[var(--text-soft)]">
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
            Using Vegan Masala
          </h2>
          <p>
            Vegan Masala provides recipes, meal-planning resources and related
            food content for general information. You may use the website and its
            resources for personal, non-commercial purposes.
          </p>
          <p>
            You are responsible for checking ingredients, allergies, nutrition and
            cooking safety for your own circumstances. The content is not medical or
            dietary advice.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
            Accounts and connected services
          </h2>
          <p>
            Site administrators may connect authorised social-media accounts to
            prepare and publish Vegan Masala content. Only an account owner or an
            authorised administrator may make that connection. A connection can be
            revoked through the relevant social platform or the Vegan Masala admin
            controls.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
            Intellectual property
          </h2>
          <p>
            Unless stated otherwise, Vegan Masala owns the website text, recipes,
            photographs, videos and downloadable resources. You may not republish,
            sell or distribute them without permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
            Availability and liability
          </h2>
          <p>
            We aim to keep the website accurate and available, but cannot guarantee
            uninterrupted access or that every item will always be error-free. To the
            extent permitted by law, Vegan Masala is not liable for losses resulting
            from reliance on the site&apos;s general information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--brand-gold)]">
            Changes and contact
          </h2>
          <p>
            These terms may be updated when the website or its services change. For
            questions about these terms, contact hello@vegan-masala.com.
          </p>
        </section>
      </div>
    </main>
  );
}
