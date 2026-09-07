import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export default function PaymentCancelledPage() {
  return (
    <PageShell
      title="Checkout cancelled"
      intro="No payment was taken and nothing was charged."
    >
      <Section heading="Nothing happened">
        <p>
          You cancelled before completing payment, so there is no order and no
          charge. Your card was never billed.
        </p>
      </Section>

      <Section heading="If something went wrong">
        <p>
          If you cancelled because something was unclear or broken, we would
          genuinely like to know - it is the most useful feedback we can get at
          this stage.{" "}
          <Link href="/contact" style={{ color: "var(--accent)" }}>
            Tell us what happened
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
