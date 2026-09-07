# AUREVIA — Current Architecture (As-Found)

**Inspection date:** 2026-09-07
**Inspected by:** Claude Code
**Status:** Greenfield. Nothing exists yet.

---

## 1. Summary

The working directory `c:\Users\PC\Desktop\AI Digital Products` was **completely empty** at inspection time. There is no existing application to preserve, extend, or avoid breaking.

This is an important finding, because the master brief was written on the assumption that an application already exists and is connected to Supabase. **It does not.** The Supabase *project* exists (see below), but no code has ever been written against it.

## 2. What was checked

| Item | Result |
|---|---|
| Repository root contents | Empty (no files, no directories) |
| Git repository | Not initialised |
| `package.json` | Does not exist |
| Framework / stack | None chosen yet |
| Frontend | None |
| Backend / API routes | None |
| Supabase client code | None |
| Authentication implementation | None |
| Existing routes | None |
| Components | None |
| Environment variables / `.env` | None |
| Payment implementation | None |
| Storage integration code | None |
| Deployment configuration | None |
| Tests | None |
| CI configuration | None |

## 3. Consequences for the build

Positive:

- The "do not break existing code" and "do not destroy existing data" constraints are trivially satisfiable — there is nothing to break and no data to lose.
- The stack can be chosen cleanly rather than inherited. The brief's preferred stack (Next.js + TypeScript + Tailwind) can be adopted without a migration.
- Schema design is unconstrained by legacy tables, so the payment/order model can be designed correctly the first time.

Negative:

- Every estimate in the brief's 30-day roadmap that assumed partial existing work is optimistic. Day 1 is genuinely day 1.
- There is no existing production traffic, so no real customer or revenue data exists to inform pricing or validation. All demand figures in the research documents are **estimates from secondary sources**, explicitly labelled as such, never presented as measured facts.

## 4. Decisions taken from this inspection

1. Proceed with Next.js (App Router) + TypeScript + Tailwind CSS as the stack — no incumbent stack exists to justify keeping.
2. Reuse the existing Supabase project `AI Digital Products` (ref `lbrhfocjonfxpbylsdip`) as the single database, per the brief's absolute rules.
3. Treat all schema work as additive greenfield migrations, versioned in `supabase/migrations/`.
4. Do not initialise application code until the niche and product decision is confirmed, since routes, schema, and copy all depend on it.

## 5. Related documents

- `docs/supabase-existing-architecture.md` — the state of the Supabase project
- `docs/safepay-integration.md` — payment gateway research and constraints
- `PROJECT_STATUS.md` — live status, decisions, and risks
