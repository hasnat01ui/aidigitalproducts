-- =============================================================================
-- AUREVIA — Time-Recovery Audit responses
-- Migration: 20260908100000_audit_responses
-- =============================================================================
--
-- Stores completed audits. This table is the lead magnet's output AND the
-- source of the original, aggregated data that makes the Cluster 1 articles
-- genuinely linkable (see marketing/seo-strategy.md section 5).
--
-- Design notes:
--   * Money is stored in MINOR UNITS as bigint, consistent with the rest of
--     the schema. hourly_rate_minor = 15000 means $150.00/hour.
--   * Hours are stored as numeric(6,2) - fractional hours are meaningful here
--     (2.5 hrs/week) and these values are never used for currency arithmetic.
--   * The per-task breakdown is jsonb rather than a child table: it is written
--     once, read as a whole, and never queried field-by-field. A child table
--     would add a join for no benefit.
--   * email is nullable on purpose. The result is shown immediately without
--     requiring an email, so an anonymous completion is a valid row. Gating
--     the number behind a form would contradict the promise on the page.
-- =============================================================================

create table public.audit_responses (
  id                    uuid primary key default gen_random_uuid(),

  -- Optional linkage. Anonymous completions are expected and welcome.
  lead_id               uuid references public.leads(id) on delete set null,
  email                 text,

  -- Inputs
  team_size             integer      not null check (team_size between 1 and 500),
  hourly_rate_minor     bigint       not null check (hourly_rate_minor >= 0),
  currency              char(3)      not null default 'USD',
  billable_hours_target numeric(6,2) not null check (billable_hours_target >= 0),

  -- [{ id, label, hoursPerWeek }, ...]
  task_breakdown        jsonb        not null default '[]'::jsonb,

  -- Computed server-side and stored so results are reproducible even if the
  -- calculation is later refined.
  total_hours_per_week  numeric(8,2) not null check (total_hours_per_week >= 0),
  total_hours_per_month numeric(9,2) not null check (total_hours_per_month >= 0),
  monthly_cost_minor    bigint       not null check (monthly_cost_minor >= 0),
  annual_cost_minor     bigint       not null check (annual_cost_minor >= 0),
  recoverable_hours_per_month numeric(9,2) not null check (recoverable_hours_per_month >= 0),
  recoverable_cost_minor      bigint       not null check (recoverable_cost_minor >= 0),

  source                text,
  created_at            timestamptz  not null default now()
);

comment on table public.audit_responses is
  'Completed Time-Recovery Audits. Also the dataset behind AUREVIA''s original research - the only linkable asset a new domain can realistically build.';

create index audit_responses_lead_idx    on public.audit_responses (lead_id);
create index audit_responses_created_idx on public.audit_responses (created_at desc);
create index audit_responses_email_idx   on public.audit_responses (lower(email))
  where email is not null;

alter table public.audit_responses enable row level security;

-- No anon or authenticated write policy: submissions go through a server route
-- so they can be validated and rate limited, exactly like lead capture.
-- Admin read only.
create policy "audit_responses: admin reads all"
  on public.audit_responses for select to authenticated
  using ((select public.is_admin()));
