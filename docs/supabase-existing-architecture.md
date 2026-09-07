# AUREVIA — Existing Supabase Architecture (As-Found)

**Inspection date:** 2026-09-07
**Method:** Supabase MCP (`list_projects`, `list_tables`, `list_migrations`, `execute_sql` against system catalogs)
**Status:** Project exists and is healthy. It is otherwise completely empty.

---

## 1. Project identity

| Field | Value |
|---|---|
| Organization ID | `eabaylxroueofjrnmzlq` |
| Project name | `AI Digital Products` |
| Project ref / ID | `lbrhfocjonfxpbylsdip` |
| Region | `ap-northeast-1` (Tokyo) |
| Status | `ACTIVE_HEALTHY` |
| Postgres version | 17.6.1.166 (engine 17, GA channel) |
| DB host | `db.lbrhfocjonfxpbylsdip.supabase.co` |
| Created | 2026-09-07 16:23 UTC |

This is the **only** project on the account. It is the project AUREVIA will use. Per the brief's absolute rules, no new project or organization will be created, and this project will not be disconnected, reset, or replaced.

> **Note on region:** the project sits in Tokyo (`ap-northeast-1`). If the confirmed customer base is Europe/North America, every database round trip carries avoidable latency. Region cannot be changed after creation, so the mitigation is architectural (aggressive caching, edge rendering for public pages, keeping the hot path off the database) rather than a migration. Flagged as a risk, not a blocker.

## 2. Actual database state

Verified by direct query against `information_schema`, `pg_policies`, `storage.buckets`, and `auth.users`:

| Metric | Count |
|---|---|
| Tables in `public` schema | **0** |
| Functions in `public` schema | **0** |
| RLS policies in `public` schema | **0** |
| Storage buckets | **0** |
| Registered auth users | **0** |
| Applied migrations | **0** |

Only the stock Supabase-managed schemas are present:

- `auth.*` — 23 stock tables, all empty except `auth.schema_migrations` (77 rows, internal). Supabase Auth is provisioned and ready but has never been used: zero users, zero identities, zero sessions.
- `storage.*` — 8 stock tables, all empty except `storage.migrations` (68 rows, internal). No buckets have been created.

## 3. Installed extensions

`plpgsql`, `pg_stat_statements`, `uuid-ossp`, `pgcrypto`, `supabase_vault`

These are the Supabase defaults. `uuid-ossp` and `pgcrypto` are present, so `gen_random_uuid()` is available for primary keys without further installation.

## 4. What this means

There is **no existing schema to inspect, preserve, or migrate around**. The brief's extensive safety rules around destructive migrations, preserving existing tables, and not deleting data are all satisfied by default at this point — but they become live constraints the moment the first migration is applied, and will be honoured from then on.

Practically:

- Every table AUREVIA needs (`profiles`, `products`, `orders`, `payments`, `product_access`, `webhook_events`, …) must be created from scratch.
- Every RLS policy must be written from scratch. No table will be created without RLS enabled and policies attached in the same migration.
- Storage buckets must be created from scratch. Paid product files go in a **private** bucket accessed only through short-lived signed URLs generated server-side after a `product_access` check.
- Auth is available immediately; email/password plus email verification will be the initial method.

## 5. Rules adopted for all future database work

1. All schema changes go through versioned files in `supabase/migrations/` — never ad-hoc SQL against production.
2. Every migration is additive. No `DROP TABLE`, no `DROP DATABASE`, no destructive resets.
3. Every user-owned table gets RLS enabled plus explicit policies in the same migration that creates it. RLS is never disabled to make something work.
4. The service-role key is server-only. It is never prefixed `NEXT_PUBLIC_`, never imported into a client component, and never committed.
5. Indexes are added deliberately based on known query patterns (lookups by `user_id`, by `order_id`, by provider transaction ID), not speculatively.
6. Before any migration is applied, the current schema is re-inspected so the migration is written against reality rather than assumption.

## 6. Configuration still required

These are not yet set and will be needed before the app runs:

- [ ] Site URL and redirect URLs configured in Supabase Auth (for email confirmation and password reset links)
- [ ] Email templates branded for AUREVIA
- [ ] Private storage bucket for paid product files
- [ ] Environment variables wired into the app and the deployment target
- [ ] Service-role key stored as a server-only secret in the deployment platform

## 7. Related documents

- `docs/current-architecture.md` — the (empty) application state
- `PROJECT_STATUS.md` — live status, decisions, and risks
