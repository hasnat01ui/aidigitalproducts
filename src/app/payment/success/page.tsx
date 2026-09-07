import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Section } from "@/components/PageShell";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

/**
 * Payment success page.
 *
 * IMPORTANT: reaching this page grants NOTHING. It is a status display only.
 *
 * The customer arrives here because the payment provider redirected their
 * browser, and a browser redirect is trivially forgeable - anyone can type
 * this URL. Entitlement is granted exclusively by the signature-verified
 * webhook.
 *
 * So this page reads the order's real status from the database and tells the
 * truth about it, including the common case where the redirect beats the
 * webhook by a second or two.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  let status: string | null = null;

  if (ref) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("orders")
      .select("status")
      .eq("reference", ref)
      .maybeSingle();
    status = data?.status ?? null;
  }

  const isPaid = status === "PAID";

  return (
    <PageShell
      title={isPaid ? "Payment confirmed" : "Payment received"}
      intro={
        isPaid
          ? "Your payment is confirmed and your access is ready."
          : "Thanks - we have your payment and are confirming it with the payment provider now."
      }
    >
      {ref && (
        <Section heading="Your order reference">
          <p style={{ fontFamily: "var(--font-mono)" }}>{ref}</p>
          <p>Keep this. Quote it in any email about this order.</p>
        </Section>
      )}

      {isPaid ? (
        <Section heading="What happens next">
          <p>
            Your receipt and access details are on their way by email. You can
            also find everything in your dashboard.
          </p>
          <p>
            <Link href="/dashboard" style={{ color: "var(--accent)" }}>
              Go to your dashboard
            </Link>
          </p>
        </Section>
      ) : (
        <Section heading="Still confirming">
          <p>
            Payment confirmation arrives from our provider separately from this
            page, and it usually lands within a few seconds. Refresh in a
            moment.
          </p>
          <p>
            We deliberately do not unlock access based on this page alone - it
            is confirmed by the provider directly, which is what keeps your
            purchase secure.
          </p>
          <p>
            If nothing changes within a few minutes, email us with the
            reference above and we will sort it out.
          </p>
        </Section>
      )}
    </PageShell>
  );
}
