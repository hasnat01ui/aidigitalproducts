import type { Metadata } from "next";

import { PageShell, Section } from "@/components/PageShell";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "AUREVIA's 30-day refund policy: how to request one, and what happens next.",
  alternates: { canonical: absoluteUrl("/refund-policy") },
};

export default function RefundPolicyPage() {
  return (
    <PageShell
      title="Refund Policy"
      updated="7 September 2026"
      intro="Digital products are easy to sell and hard to return, which is why so many refund policies in this category are deliberately difficult. Ours is not."
    >
      <Section heading="30 days, no questions">
        <p>
          If a product is not right for you, email us within 30 days of purchase
          and we will refund it in full.
        </p>
        <p>
          We will not ask you to justify the decision, prove you used it, sit
          through a call, or accept credit instead of money. One email is
          enough.
        </p>
      </Section>

      <Section heading="How to request one">
        <p>
          Email{" "}
          <a href={`mailto:${site.contactEmail}`} style={{ color: "var(--accent)" }}>
            {site.contactEmail}
          </a>{" "}
          from the address you bought with, or include your order reference (it
          looks like AUR-XXXXXX and is on your receipt).
        </p>
      </Section>

      <Section heading="What happens next">
        <p>
          We aim to approve refund requests within 2 business days. Once
          approved, the money is returned through our payment provider to your
          original payment method. How long it takes to appear depends on your
          bank — typically 5 to 10 business days, which is outside our control.
        </p>
        <p>
          Access to the refunded product ends when the refund is processed.
        </p>
      </Section>

      <Section heading="The limits">
        <p>
          We may decline a refund where a product has been redistributed,
          resold, or shared in breach of our{" "}
          <a href="/terms" style={{ color: "var(--accent)" }}>Terms</a>, or where
          someone repeatedly buys and refunds the same product.
        </p>
        <p>
          These are the only exceptions, and they exist to stop abuse — not to
          give us a way out of a genuine request.
        </p>
      </Section>

      <Section heading="Subscriptions">
        <p>
          We do not currently offer subscriptions. When we do, this page will be
          updated to explain cancellation and renewal before anything is sold.
        </p>
      </Section>
    </PageShell>
  );
}
