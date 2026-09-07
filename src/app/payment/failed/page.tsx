import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Payment failed",
  robots: { index: false, follow: false },
};

export default function PaymentFailedPage() {
  return (
    <PageShell
      title="Payment failed"
      intro="The payment did not go through, and you have not been charged."
    >
      <Section heading="What usually causes this">
        <p>
          Most failures are the card issuer declining an unfamiliar
          international charge, an expired card, or a typo in the card details.
          None of them mean anything is wrong with your account here.
        </p>
      </Section>

      <Section heading="What to do">
        <p>
          Try again with the same or a different card. If it fails a second
          time, it is usually worth a quick call to your bank - they can often
          approve it immediately.
        </p>
        <p>
          Still stuck?{" "}
          <Link href="/contact" style={{ color: "var(--accent)" }}>
            Email us
          </Link>{" "}
          and we will help.
        </p>
      </Section>
    </PageShell>
  );
}
