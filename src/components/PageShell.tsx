import Link from "next/link";

import { site } from "@/lib/site";

/**
 * Shared chrome for content pages. Keeps nav and footer identical across the
 * site so internal linking (an SEO signal) is consistent and no page becomes
 * an orphan.
 */
export function PageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.14em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {site.name}
          </Link>
          <Link href="/#audit" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            Get the free audit
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl">{title}</h1>
        {updated && (
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Last updated {updated}
          </p>
        )}
        {intro && (
          <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {intro}
          </p>
        )}
        <div className="prose-aurevia mt-10 space-y-8">{children}</div>
      </main>

      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span
            className="text-sm font-semibold tracking-[0.14em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {site.name}
          </span>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {site.tagline}
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refunds</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
        {heading}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </section>
  );
}
