import type { Metadata } from "next";

import { PageShell, Section } from "@/components/PageShell";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach AUREVIA — support, refunds, privacy and press.",
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact"
      intro="We are a small team. Email reaches a person, and we answer it ourselves."
    >
      <Section heading="Email">
        <p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="text-lg"
            style={{ color: "var(--accent)" }}
          >
            {site.contactEmail}
          </a>
        </p>
        <p>
          Use the same address for support, refunds, privacy requests, and
          anything else. We aim to reply within 2 business days.
        </p>
      </Section>

      <Section heading="Refunds">
        <p>
          Email us within 30 days and we will process it — see the{" "}
          <a href="/refund-policy" style={{ color: "var(--accent)" }}>Refund Policy</a>.
          You do not need to explain why.
        </p>
      </Section>

      <Section heading="Your data">
        <p>
          To request a copy of your data or have it deleted, email us and say
          so. Details are in our{" "}
          <a href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
        </p>
      </Section>
    </PageShell>
  );
}
