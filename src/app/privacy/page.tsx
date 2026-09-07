import type { Metadata } from "next";

import { PageShell, Section } from "@/components/PageShell";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What data AUREVIA collects, why, how long it is kept, and how to have it deleted.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      updated="7 September 2026"
      intro="This describes what we actually collect and do today — not a template of what a larger company might do. It will be updated as the product grows, and the date above will change when it does."
    >
      <Section heading="Who we are">
        <p>
          {site.name} sells digital products and systems for small agencies and
          independent consultants. For any privacy question, contact{" "}
          <a href={`mailto:${site.contactEmail}`} style={{ color: "var(--accent)" }}>
            {site.contactEmail}
          </a>
          .
        </p>
      </Section>

      <Section heading="What we collect">
        <p>
          <strong>If you request a free resource:</strong> your email address,
          and your name and company if you choose to give them. We also record
          which resource you asked for and roughly where on the site you asked.
        </p>
        <p>
          <strong>If you create an account:</strong> your email address and any
          profile details you enter. Authentication is handled by Supabase.
        </p>
        <p>
          <strong>If you buy something:</strong> your email, order details, and
          the amount charged. Payment is processed by our payment provider on
          their own hosted page — <strong>we never see or store your card
          number, expiry date, or security code.</strong> They do not reach our
          systems at any point.
        </p>
        <p>
          <strong>Usage events:</strong> we record actions such as page views
          and purchases so we can tell what is working. This is stored in our
          own database rather than sold or shared.
        </p>
      </Section>

      <Section heading="What we do not do">
        <p>
          We do not sell your data. We do not share it with advertisers. We do
          not buy email lists, and we do not add anyone to our list who did not
          ask to be on it.
        </p>
      </Section>

      <Section heading="Why we are allowed to hold it">
        <p>
          For marketing emails, your consent — given when you request a
          resource, and withdrawable at any time. For purchases, because we
          need the data to perform the contract and to meet accounting
          obligations. For usage analytics, our legitimate interest in
          understanding whether the product works.
        </p>
      </Section>

      <Section heading="Who processes it for us">
        <p>
          Supabase (database, authentication and file storage), our hosting
          provider, our payment provider, and our transactional email provider.
          Each only receives what it needs to do its job.
        </p>
      </Section>

      <Section heading="Where it is stored">
        <p>
          Our database is hosted in the Asia Pacific (Tokyo) region. If you are
          outside that region, your data is transferred there to be stored.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Marketing contacts: until you unsubscribe, then we retain a minimal
          record so we do not email you again by mistake. Order and payment
          records: as long as tax and accounting rules require. Account data:
          until you ask us to delete the account.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can ask for a copy of your data, ask us to correct it, or ask us
          to delete it. You can unsubscribe from any email in one click. Email{" "}
          <a href={`mailto:${site.contactEmail}`} style={{ color: "var(--accent)" }}>
            {site.contactEmail}
          </a>{" "}
          and we will action it. We do not require you to explain why.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We use cookies that are strictly necessary to keep you signed in. We
          do not currently run advertising or third-party tracking cookies. If
          that changes, this page will be updated first and you will be asked
          for consent where the law requires it.
        </p>
      </Section>
    </PageShell>
  );
}
