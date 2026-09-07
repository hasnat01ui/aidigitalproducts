# AUREVIA — Project Status

**Tagline:** Intelligence. Packaged for Growth.
**Last updated:** 2026-09-07
**Phase:** Research complete. Foundation built. Ready for validation Stages 1–3.

---

## Completed

### Research (roadmap days 1–7)

| Item | Output |
|---|---|
| Repository inspection | `docs/current-architecture.md` — **repo was empty; nothing existed** |
| Supabase inspection | `docs/supabase-existing-architecture.md` — **project existed, database completely empty** |
| Safepay research | `docs/safepay-integration.md` — integration model, fees, geography constraint |
| Niche research (20 scored) | `research/niche-analysis.md` |
| Customer avatar | `research/customer-avatar.md` |
| Competitor analysis (10) | `research/competitor-analysis.md` |
| Market gaps | `research/market-gaps.md` |
| Product ideation (20 scored) | `research/product-ideas.md` |
| Validation plan | `validation/validation-plan.md` |
| Brand guide | `brand/brand-guide.md` |
| Security posture | `docs/security.md` |

### Build

| Item | Detail |
|---|---|
| Stack scaffolded | Next.js 16.3.4 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 |
| Database schema | 12 tables, 21 RLS policies, applied to the existing Supabase project |
| Security hardening | 5 of 6 advisor warnings resolved; 1 documented as accepted |
| Supabase clients | Browser, server (RLS-respecting), and admin (`server-only` guarded) |
| Env validation | Zod-validated, client/server split so secrets cannot reach the bundle |
| Payment abstraction | `PaymentProvider` interface + Safepay adapter (structure complete, wire format unconfirmed) |
| Money handling | Integer minor units throughout; no floating-point currency |
| Landing page | Homepage with lead capture, brand tokens, dark mode, honest no-proof positioning |
| Lead capture API | Validated, rate-limited, honeypot-protected |
| SEO foundation | sitemap, robots (preview-blocked), canonicals, Organization/WebSite/FAQPage JSON-LD |
| Security headers | HSTS, X-Frame-Options, Permissions-Policy, COOP; `X-Powered-By` off |
| Legal pages | `/privacy`, `/terms`, `/refund-policy`, `/contact` — previously 404s linked from the footer |
| Marketing docs | `marketing/seo-strategy.md`, `marketing/blog-topics.md` (30 topics) |
| Deployment guide | `docs/deployment.md` |
| Build + lint + typecheck | ✅ All passing (11 routes) |
| Functional DB tests | ✅ Email normalisation, case-insensitive upsert, and order-total tamper rejection all verified; test data removed |

### Migrations applied

1. `20260907120000_aurevia_core_schema` — core commerce schema
2. `20260907130000_harden_functions_and_policies` — advisor remediation
3. `20260907140000_leads_email_normalisation` — upsert conflict target fix

## In progress

- Nothing. Awaiting the next work block.

## Not deployed yet — and deliberately so

The codebase is deployment-ready, but going public should wait for two things:

1. **Transactional email is not connected** — the form captures addresses but nothing sends.
2. **The lead magnet does not exist** — there is nothing to send even once email works.

The form copy is honest about this, so nothing on the site is untrue. But announcing it before the audit exists would burn the first wave of traffic. A private staging deploy is safe now (preview deploys are auto-blocked from indexing).

Deployment, domain purchase, and Google Search Console verification all require the founder's own accounts — see `docs/deployment.md`.

## Blocked

| Blocker | Impact | Notes |
|---|---|---|
| **Safepay merchant account** | Blocks all revenue and validation Stage 4 | Not started. Requires a registered Pakistani business entity + KYC. **Longest external lead time — this is the critical path.** |
| **Safepay wire format** | Payment adapter cannot be completed | Depends on sandbox access, which depends on the account above. Adapter throws rather than guessing. |
| **Customer interviews** | Gate G1 | Founder-led; cannot be automated |

## Next

**Immediate (unblocked, in priority order):**

1. Build the free Time-Recovery Audit — the lead magnet and the instrument that tests assumption A1
2. Auth flows: register, login, email verification, password reset, protected routes
3. Legal pages: privacy, terms, refund policy, contact
4. Security headers / CSP in `next.config.ts`
5. Private storage bucket + signed-URL download route
6. Remaining docs: pricing, AI unit economics, email funnel, SEO, content calendar

**Founder-led, start now in parallel:**

7. Apply for the Safepay merchant account — critical path
8. Run validation Stage 1 (community research) and Stage 2 (10–15 interviews)

**Gated — do not start until G4 passes:**

9. The flagship $299 Non-Billable Recovery System

## Decisions

| # | Decision | Rationale | Date |
|---|---|---|---|
| D1 | Reuse Supabase project `lbrhfocjonfxpbylsdip` | Mandated; healthy and empty | 2026-09-07 |
| D2 | Next.js + TypeScript + Tailwind | No incumbent stack existed | 2026-09-07 |
| D3 | **Niche #7 — AI service-delivery systems for small agencies** | Confirmed by founder. Business buyer with monetary pain; supports the premium pricing Safepay's flat fee requires; expansion path matches the roadmap | 2026-09-07 |
| D4 | Product ladder: free audit → $79 → $299 → $799 → Pro | De-risks the expensive build behind two cheap validation steps | 2026-09-07 |
| D5 | `PaymentProvider` abstraction mandatory in v1 | Safepay is PKR-centric; this is the mechanism for adding an international provider later | 2026-09-07 |
| D6 | Primary Safepay source is `safepay-docs.netlify.app` | The mintlify site documents the Raast aggregator, not merchant checkout | 2026-09-07 |
| D7 | Flagship gated behind validation G4 | Highest-cost build must be earned by evidence | 2026-09-07 |
| D8 | **Global, USD-priced** | Confirmed by founder. Best WTP and fits premium positioning; accepts international fee rate and currency-mismatch friction | 2026-09-07 |
| D9 | Safepay adapter throws rather than guessing endpoints | Brief forbids guessing endpoints; an adapter that looks finished but is subtly wrong is worse than one that refuses to run | 2026-09-07 |
| D10 | Turbopack pinned in `dev` and `build` scripts | `next/font` emits Turbopack-internal imports in Next 16; webpack build fails | 2026-09-07 |
| D11 | `leads.email` normalised by trigger + plain unique constraint | PostgREST cannot infer a functional index as an ON CONFLICT target; moving the invariant into the DB avoids a racy select-then-insert | 2026-09-07 |
| D12 | `is_admin` remains executable by `authenticated` | Required for RLS evaluation; takes no arguments and leaks nothing. Documented in `docs/security.md` §3 | 2026-09-07 |

## Risks

| # | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | **Safepay merchant account delayed or declined** | Critical | Medium | Apply immediately. Validation Stages 1–3 run without it; Stage 4 falls back to intent-based waitlist (a weaker signal, and labelled as such) |
| R2 | **Safepay is PKR-centric while pricing is USD** | High | High | `PaymentProvider` abstraction; measure checkout completion by geography; be transparent about charge currency at checkout |
| R3 | **Validation fails at G1** | High | Medium | Cheap tests first; niche #8 pre-planned as a fallback sharing most content |
| R4 | **No social proof** | High | Certain (now) | Founding-customer motion; earn real testimonials in Stage 5; never fabricate |
| R5 | **"Just another prompt pack" perception** | High | Medium | Positioning on method not prompts; demonstrate rather than claim |
| R6 | **Supabase region is Tokyo**, customers are US/EU | Low | High | Cannot change post-creation. Mitigate with caching and edge rendering |
| R7 | **Model churn** breaks product content | Medium | High | Model-agnostic design; maintenance becomes the Aurevia Pro value proposition |
| R8 | **Solo-founder capacity** | Medium | High | Sequence strictly by validation gates; never build ahead of evidence |
| R9 | **Rate limiting is per-instance** | Medium | Medium | Move to a shared store before multi-instance deployment |

## Business metrics

No customers, no revenue, no traffic. All metrics are genuinely zero. This section carries real numbers only — never projections presented as results.

| Metric | Value |
|---|---|
| Visitors | 0 |
| Email leads | 0 |
| Customers | 0 |
| Revenue | 0 |
| Orders | 0 |
| Refund rate | n/a |
| Conversion rate | n/a |

### Milestone tracker

- [ ] First 10 email leads
- [ ] First 100 email leads
- [ ] First pre-sale
- [ ] First 10 customers
- [ ] First $100
- [ ] First $1,000
- [ ] First recurring subscriber
- [ ] First $5,000
- [ ] First 100 customers
