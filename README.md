# AUREVIA

**Intelligence. Packaged for Growth.**

AI systems for small agencies and independent consultants — the workflows, standards and review gates that turn the AI tools a team already pays for into consistent client work.

---

## Status

Pre-launch. No customers, no revenue, no product shipped yet. The business thesis is a **hypothesis under test** — see [`validation/validation-plan.md`](validation/validation-plan.md).

Nothing in this repo claims traction that does not exist.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database / Auth / Storage | Supabase (Postgres 17) |
| Payments | Safepay (primary, behind a provider abstraction) |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack required — `next/font` depends on it) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

### Environment

See [`.env.example`](.env.example). The only variables required to run the site are the app URL and the Supabase URL, publishable key, and service-role key.

Safepay, AI and email keys are optional — blank is treated as absent, and code paths that need them fail loudly rather than half-working.

> **`SUPABASE_SERVICE_ROLE_KEY` bypasses all row level security.** Server-only, never prefixed `NEXT_PUBLIC_`, never committed. `src/lib/supabase/server.ts` uses `import "server-only"` so importing it from a client component is a build error.

## Layout

```
src/
  app/            routes, API handlers, sitemap + robots
  components/     UI, structured data
  lib/            env validation, money, site config, Supabase clients
  services/
    payment/      PaymentProvider abstraction + Safepay adapter
supabase/
  migrations/     versioned, additive SQL
docs/             architecture, security, Safepay, deployment
research/         niche, customer, competitor, product analysis
marketing/        SEO strategy, blog plan
validation/       the plan that gates the build
brand/            brand guide
```

## Principles enforced in code

1. **Money is integer minor units.** Never floating point.
2. **Payment success is never inferred from the browser.** Access is granted only after server-side verification.
3. **Totals are computed server-side** and protected by a database CHECK constraint.
4. **Webhook processing is idempotent** — enforced by a unique index, not by application logic.
5. **RLS on every table**, deny-by-default for customer writes. Never disabled to make something work.
6. **No fabricated proof.** No invented testimonials, customer counts, revenue, or scarcity — anywhere, including staging.

## Documentation

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — live status, decisions, risks
- [`docs/deployment.md`](docs/deployment.md) — deploy and Google Search Console setup
- [`docs/security.md`](docs/security.md) — security posture and known gaps
- [`docs/safepay-integration.md`](docs/safepay-integration.md) — payment research and constraints
