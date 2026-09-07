import type { Metadata } from "next";
import Link from "next/link";

import { AuditTool } from "@/components/AuditTool";
import { SiteFooter } from "@/components/PageShell";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agency Time-Recovery Audit",
  description:
    "Work out what non-billable work costs your agency each month — proposals, onboarding, reporting, admin. Free, no signup required to see your number.",
  alternates: { canonical: absoluteUrl("/audit") },
  openGraph: {
    title: "Agency Time-Recovery Audit — AUREVIA",
    description:
      "What is non-billable work actually costing your agency? Get a number in about five minutes.",
    url: absoluteUrl("/audit"),
  },
};

export default function AuditPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Time-Recovery Audit", path: "/audit" },
        ]}
      />

      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.14em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {site.name}
          </Link>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Free — no signup
          </span>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p
            className="text-xs font-medium uppercase tracking-[0.18em]"
            style={{ color: "var(--accent)" }}
          >
            Free tool
          </p>
          <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl">
            The Agency Time-Recovery Audit
          </h1>
          <p
            className="mt-6 text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Non-billable work is the most expensive thing in an agency and the
            least measured. Adjust the sliders to match your team and you will
            have a number in about five minutes.
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            No signup, no gate. The result appears as you type — email is
            optional and only sends you a copy.
          </p>
        </div>

        <div className="mt-16">
          <AuditTool />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
