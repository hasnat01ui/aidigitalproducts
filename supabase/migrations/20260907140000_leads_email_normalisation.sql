-- =============================================================================
-- AUREVIA — Normalise lead emails so upsert can infer the conflict target
-- Migration: 20260907140000_leads_email_normalisation
-- =============================================================================
--
-- The original schema used a functional unique index on lower(email). That is
-- correct for enforcing case-insensitive uniqueness, but PostgREST can only
-- infer an ON CONFLICT target from a plain column, so `upsert(..., {
-- onConflict: "email" })` from the lead-capture route would fail.
--
-- Rather than work around it in application code (select-then-insert, which is
-- racy under concurrent submissions), the invariant is moved into the database:
-- emails are normalised to lowercase by a trigger, and uniqueness is enforced
-- by a plain unique constraint on the column.
--
-- Safe: the leads table is empty, so the normalising UPDATE below is a no-op
-- and no data can be lost. It is included anyway so the migration is correct
-- if replayed against a populated environment.
-- =============================================================================

-- Normalise any existing rows before adding the constraint.
update public.leads set email = lower(trim(email));

-- Collapse any pre-existing case-variant duplicates, keeping the oldest row.
delete from public.leads a
using public.leads b
where a.email = b.email
  and a.created_at > b.created_at;

drop index if exists public.leads_email_idx;

create or replace function public.normalise_lead_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email = lower(trim(new.email));
  return new;
end;
$$;

create trigger leads_normalise_email
  before insert or update on public.leads
  for each row execute function public.normalise_lead_email();

alter table public.leads
  add constraint leads_email_key unique (email);

comment on constraint leads_email_key on public.leads is
  'Plain unique constraint (not a functional index) so PostgREST can infer it as an ON CONFLICT target. Case-insensitivity is guaranteed by the leads_normalise_email trigger instead.';
