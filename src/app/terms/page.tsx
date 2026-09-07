import type { Metadata } from "next";

import { PageShell, Section } from "@/components/PageShell";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you use the AUREVIA website or buy an AUREVIA product.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      updated="7 September 2026"
      intro="Plain terms for a small business. If anything here is unclear, email us and ask — we would rather explain it than rely on you not reading it."
    >
      <Section heading="Agreement">
        <p>
          By using this website or buying a product from {site.name}, you agree
          to these terms. If you do not agree, please do not use the site.
        </p>
      </Section>

      <Section heading="What we sell">
        <p>
          Digital products: systems, workflows, templates, documents and
          software tools delivered electronically. There is no physical
          shipment. Product pages describe what is included, and that
          description is what we are obliged to deliver.
        </p>
      </Section>

      <Section heading="Your licence">
        <p>
          When you buy a product you receive a non-exclusive, non-transferable
          licence to use it inside your own business, including with your own
          team and for your own client work.
        </p>
        <p>
          You may not resell it, redistribute it, publish it, share your account,
          or repackage it as your own product for sale. Using our materials to
          deliver services to your clients is fine and expected. Selling our
          materials as a competing product is not.
        </p>
      </Section>

      <Section heading="Accounts">
        <p>
          You are responsible for keeping your login details secure and for
          activity under your account. Tell us promptly if you think it has been
          compromised.
        </p>
      </Section>

      <Section heading="Payment">
        <p>
          Prices are shown on the product page. Payment is taken by our payment
          provider on their hosted checkout. The amount charged is always
          calculated by us on our server — never by your browser. Access to a
          product is granted only after the payment provider confirms the
          payment to us directly.
        </p>
      </Section>

      <Section heading="Refunds">
        <p>
          Covered separately in our <a href="/refund-policy" style={{ color: "var(--accent)" }}>Refund Policy</a>, which forms part of these terms.
        </p>
      </Section>

      <Section heading="What we do and do not promise">
        <p>
          We promise the product will match its description and that we will fix
          it or refund you if it does not.
        </p>
        <p>
          We do not promise specific business results. Our products are systems
          and tools; what you get out of them depends on how you use them, your
          market and your team. Anyone guaranteeing you revenue from a digital
          product is not being straight with you, and we are not going to.
        </p>
        <p>
          Our products are used alongside third-party AI tools that we do not
          control. Those tools change, and their output requires human review.
          Do not send AI output to a client without checking it.
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          To the extent the law allows, our total liability to you is limited to
          the amount you paid us in the twelve months before the claim. We are
          not liable for indirect or consequential losses such as lost profits.
          Nothing here limits liability that cannot legally be limited.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms. The date at the top will change when we do.
          Material changes affecting existing customers will be emailed rather
          than quietly published.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          <a href={`mailto:${site.contactEmail}`} style={{ color: "var(--accent)" }}>
            {site.contactEmail}
          </a>
        </p>
      </Section>
    </PageShell>
  );
}
