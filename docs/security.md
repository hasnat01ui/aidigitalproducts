# AUREVIA — Security

**Last updated:** 2026-09-07

---

## 1. Current posture

| Control | Status |
|---|---|
| Supabase Auth | Provisioned, not yet wired into the app |
| RLS on every `public` table | ✅ Enabled — 12 tables, 21 policies |
| Service-role key isolation | ✅ `import "server-only"` guard in `src/lib/supabase/server.ts` |
| Server-side price calculation | ✅ Enforced at the database level by a CHECK constraint |
| Webhook idempotency | ✅ Unique index on `(provider, provider_event_id)` |
| Card data | ✅ Never touches AUREVIA — provider-hosted checkout only |
| Input validation | ✅ Zod on the lead endpoint; to extend with each new route |
| Rate limiting | ⚠️ In-memory, single-instance only — see §4 |
| Secrets in git | ✅ `.env*` ignored; `.env.example` explicitly re-included |
| Webhook signature verification | ⛔ Not implemented — Safepay wire format unconfirmed |
| Audit logging | ⛔ Not yet built |

## 2. Principles enforced in the schema

These are structural, not conventions — they hold even if application code has a bug.

1. **Deny by default.** Customers have `SELECT` on their own rows and nothing more. There is no `INSERT` or `UPDATE` policy on `orders`, `payments`, `product_access`, or `webhook_events` for any client role. Those tables are written exclusively by the server using the service-role key, after verification.

2. **Totals cannot be tampered with.** `orders_total_is_consistent` is a CHECK constraint requiring `total = subtotal - discount + tax`. Even a compromised server code path cannot persist an order whose charged total disagrees with its breakdown. *Verified by test: an insert with a mismatched total is rejected with a `check_violation`.*

3. **Webhooks cannot be replayed.** A unique index on `(provider, provider_event_id)` means a duplicate delivery fails to insert. Access cannot be granted twice and revenue cannot be double-counted, regardless of how many times the provider retries.

4. **Access is an explicit grant.** `product_access` rows are the only thing that authorises a download, and they are created solely after webhook-verified payment. Visiting `/payment/success` grants nothing.

5. **Role escalation is blocked at the row level.** `profiles` allows a user to update their own row, but the `prevent_role_escalation` trigger raises an exception if a non-admin attempts to change `role`. Being able to edit your own profile is not a path to becoming an admin.

6. **Money is integer minor units.** No floating-point currency anywhere. See `src/lib/money.ts`.

## 3. Supabase advisor findings

Six security warnings were raised after the initial migration; five were fixed in `20260907130000_harden_functions_and_policies`:

- `set_updated_at` and `prevent_role_escalation` had mutable `search_path` → pinned to `''`.
- `handle_new_user` was callable as RPC by `anon` and `authenticated` → `EXECUTE` revoked from all API roles, granted only to `supabase_auth_admin`.
- `is_admin` was callable by `anon` → revoked, and every policy referencing it was scoped `TO authenticated` so the anon role never evaluates it.

### Accepted risk: `is_admin` executable by `authenticated`

**Status: accepted, not a defect.**

`public.is_admin()` remains callable over RPC by signed-in users. This is deliberate and cannot be removed without breaking RLS:

- Policy expressions are evaluated with the privileges of the calling role, so `authenticated` must retain `EXECUTE` for every admin policy to function.
- The function takes **no arguments** and returns only whether *the caller* is an admin. It discloses nothing about any other user, cannot be used to enumerate admins, and returns a value the caller already knows.

Revoking it would break admin access entirely in exchange for no security gain. Re-evaluate only if the function ever gains parameters.

## 4. Known gaps

| Gap | Risk | Plan |
|---|---|---|
| Rate limiting is per-instance and in-memory | Bypassable across instances; resets on deploy | Move to a shared store before multi-instance deployment |
| No webhook signature verification | **Blocks go-live** | Implement once the Safepay scheme is confirmed. Until then the adapter throws rather than trusting anything. |
| No audit log | Reduced forensic ability | Add an `audit_log` table covering admin actions, refunds, and access grants |
| No security headers / CSP | XSS and clickjacking exposure | Add via `next.config.ts` headers before launch |
| Auth flows not built | — | Email/password + verification, then protected routes |
| No email verification enforcement on purchase | Access could attach to an unverified address | Require a verified email before granting `product_access` |

## 5. Rules that do not bend

1. The service-role key is never prefixed `NEXT_PUBLIC_`, never imported client-side, never committed.
2. RLS is never disabled to make something work.
3. Frontend payment confirmation is never trusted.
4. The final charged amount is always computed server-side.
5. Card numbers, CVV, and raw cardholder data are never stored.
6. Production credentials never exist in a development environment.
7. Every new table ships with RLS and policies in the same migration that creates it.
