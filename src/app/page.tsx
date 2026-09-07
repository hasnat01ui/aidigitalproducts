import type { Metadata } from "next";

import { LeadForm } from "@/components/LeadForm";
import { SiteFooter } from "@/components/PageShell";
import {
  FaqJsonLd,
  OrganizationJsonLd,
  WebSiteJsonLd,
} from "@/components/StructuredData";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "AUREVIA — Intelligence. Packaged for Growth.",
  description:
    "The operating method for AI in small agencies. Recover the hours lost to proposals, onboarding and reporting — without hiring.",
  alternates: { canonical: absoluteUrl("/") },
};

/* --------------------------------------------------------------------------
   Content note
   --------------------------------------------------------------------------
   Every claim on this page is either a description of the method or a
   statement the founder can stand behind. There are no testimonials, no
   customer counts, no revenue figures and no countdown timers, because AUREVIA
   has no customers yet. The "Where we are" section says so plainly. That
   honesty is the positioning, not a placeholder to fill in later.
   -------------------------------------------------------------------------- */

const steps = [
  {
    n: "01",
    title: "Measure what you're losing",
    body: "Start with the free audit. It turns a vague feeling that admin is eating the week into a number: hours per person, per task, per month.",
  },
  {
    n: "02",
    title: "Install the workflows",
    body: "Each non-billable task gets a defined chain — the inputs it needs, the prompt that does the work, the review gate, and the output standard it has to meet.",
  },
  {
    n: "03",
    title: "Hand it to the team",
    body: "The workflows are written to be run by whoever does the task, not just by you. Same inputs, same standard, whoever is at the keyboard.",
  },
  {
    n: "04",
    title: "Measure again",
    body: "Re-run the audit after 30 days against your own baseline. If the number hasn't moved, the system hasn't worked and you should ask for your money back.",
  },
];

const faqs = [
  {
    q: "How is this different from a prompt pack?",
    a: "A prompt pack gives you text to paste. A system defines the whole chain: what goes in, who reviews it, what “good” looks like, and what happens when the output isn't good enough. Prompts are one component of that, and they are the easiest part to replace.",
  },
  {
    q: "Why not just use ChatGPT? We already pay for it.",
    a: "You should keep using it. AUREVIA is not a replacement for your AI tool — it runs on top of whichever one you already pay for. The tool is the engine; what's missing is the method for using it the same way twice.",
  },
  {
    q: "Will this work with Claude or Gemini instead?",
    a: "Yes. The workflows are written to be model-agnostic, because models change every few months and anything welded to one vendor is already halfway to obsolete.",
  },
  {
    q: "Will my team actually use it?",
    a: "That is the real risk, and it is worth being straight about: most AI purchases fail at adoption, not at capability. The workflows are built around how a task is already done rather than asking anyone to work differently, and staff onboarding is part of the system rather than an afterthought. It still requires you to roll it out.",
  },
  {
    q: "What if it doesn't work for us?",
    a: "Full refund within 30 days. Email us and we'll process it — we won't ask you to justify it or sit through a retention call.",
  },
  {
    q: "Who is behind AUREVIA?",
    a: "A small team building in public. We have no case studies yet, which is why the audit is free and the first products are priced for people willing to judge the work on its merits rather than on someone else's testimonial.",
  },
];

export default function HomePage() {
  return (
    <main>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <FaqJsonLd faqs={faqs} />

      {/* ---------------------------------------------------------------- Nav */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur"
        style={{ background: "color-mix(in oklab, var(--surface) 85%, transparent)" }}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span
            className="text-lg font-semibold tracking-[0.14em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            AUREVIA
          </span>
          <a
            href="/audit"
            className="rounded-[--radius-base] px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent-strong)", color: "#0b0d10" }}
          >
            Take the free audit
          </a>
        </nav>
      </header>

      {/* -------------------------------------------------------------- Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <p
          className="text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--accent)" }}
        >
          Intelligence. Packaged for Growth.
        </p>

        <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] sm:text-6xl">
          Your agency isn&rsquo;t short of demand.
          <br />
          It&rsquo;s short of hours.
        </h1>

        <p
          className="mt-6 max-w-2xl text-lg leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Proposals, onboarding, status reports, QA. Between a quarter and
          <span style={{ color: "var(--text)" }}> two-fifths of your team&rsquo;s week</span>{" "}
          goes into work no client is billed for. AUREVIA is the operating
          method that hands those hours back — using the AI tools you already
          pay for.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4" id="audit">
          <a
            href="/audit"
            className="rounded-[--radius-base] px-6 py-3 text-base font-medium"
            style={{ background: "var(--accent-strong)", color: "#0b0d10" }}
          >
            Take the free audit
          </a>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            No signup. Your number appears as you type.
          </span>
        </div>
      </section>

      {/* ----------------------------------------------------------- Problem */}
      <section
        className="border-y py-20"
        style={{ background: "var(--surface-sunken)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl sm:text-4xl">The bottleneck isn&rsquo;t talent</h2>
          <p
            className="mt-4 max-w-2xl text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Every agency hits the same ceiling. Revenue is capped by hours, and
            the hours are going somewhere they can&rsquo;t be invoiced.
          </p>

          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Every project starts blank", "The tenth proposal takes nearly as long as the first. Nothing compounds."],
              ["Quality depends on who's on it", "So everything routes back through you for review. You are the bottleneck."],
              ["AI is used, inconsistently", "Everyone has their own prompts. The output quality is a lottery."],
              ["You turn work away", "At capacity, but hiring is what ate the margin last time."],
            ].map(([title, body]) => (
              <li key={title}>
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------- Mechanism / how */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl sm:text-4xl">Tools, then method</h2>
        <p className="mt-4 max-w-2xl text-lg" style={{ color: "var(--text-muted)" }}>
          You already have the engine. What&rsquo;s missing is the thing that
          makes it produce the same quality twice.
        </p>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-5">
              <span
                className="text-sm font-medium tabular-nums"
                style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
              >
                {step.n}
              </span>
              <div>
                <h3 className="text-xl">{step.title}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------- Who it's for */}
      <section className="border-y py-20" style={{ background: "var(--surface-sunken)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl sm:text-4xl">Who this is for</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                A good fit
              </h3>
              <ul className="mt-4 space-y-3" style={{ color: "var(--text-muted)" }}>
                <li>Agencies of roughly 2&ndash;15 people, past survival mode</li>
                <li>Independent consultants billing by the hour or the retainer</li>
                <li>Teams already paying for ChatGPT, Claude or Gemini</li>
                <li>Owners who review everything and want to stop</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                Not a good fit
              </h3>
              <ul className="mt-4 space-y-3" style={{ color: "var(--text-muted)" }}>
                <li>Solo freelancers with no delivery process to systematise</li>
                <li>Anyone wanting AI to run the agency unsupervised</li>
                <li>Teams looking for done-for-you implementation</li>
                <li>Enterprises needing procurement, SSO and a security review</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Honest status */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="text-3xl sm:text-4xl">Where we are</h2>
        <div className="mt-6 space-y-4 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>
            AUREVIA is new. We don&rsquo;t have testimonials, customer counts or
            case studies, and we&rsquo;re not going to invent any — you&rsquo;ve
            seen enough of that in this category.
          </p>
          <p>
            What we have is the method, and a free audit that gives you a real
            number whether or not you ever buy anything. Take the audit. If the
            number is small, you don&rsquo;t have this problem and we&rsquo;d
            rather you found that out for free.
          </p>
          <p style={{ color: "var(--text)" }}>
            If it&rsquo;s large, we&rsquo;ll show you what we&rsquo;re building
            and you can judge it on the work.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section className="border-t py-24" style={{ background: "var(--surface-sunken)" }}>
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl sm:text-4xl">Questions</h2>
          <dl className="mt-10 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="text-lg font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
                  {faq.q}
                </dt>
                <dd className="mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------- Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="max-w-2xl text-3xl sm:text-4xl">
          Find out what non-billable work is actually costing you.
        </h2>
        <p className="mt-4 max-w-2xl text-lg" style={{ color: "var(--text-muted)" }}>
          The Time-Recovery Audit takes about five minutes and gives you a
          number you can act on — with or without us.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="/audit"
            className="rounded-[--radius-base] px-6 py-3 text-base font-medium"
            style={{ background: "var(--accent-strong)", color: "#0b0d10" }}
          >
            Take the free audit
          </a>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Free, and you keep the result either way.
          </span>
        </div>

        <div className="mt-16 max-w-md border-t pt-10">
          <p className="text-sm font-medium">Rather just follow along?</p>
          <p className="mt-1 mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
            We email when something worth reading ships. A couple of times a month.
          </p>
          <LeadForm source="footer-newsletter" />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
