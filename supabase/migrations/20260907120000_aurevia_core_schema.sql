-- =============================================================================
-- AUREVIA — Core commerce schema
-- Migration: 20260907120000_aurevia_core_schema
-- =============================================================================
--
-- Context: the database was verified empty before this migration was written
-- (0 tables, 0 policies, 0 buckets, 0 users). This migration is purely additive
-- and creates no risk to existing data because there is none.
--
-- Design rules applied throughout:
--   * Money is stored as BIGINT in MINOR UNITS (cents). Never float, never
--     numeric-with-implicit-scale. Currency is always stored alongside it.
--   * Every user-owned table has RLS enabled in the same statement block that
--     creates it. RLS is never added "later".
--   * Customers may READ their own rows. They may never INSERT or UPDATE
--     orders, payments, or product access — those are written exclusively by
--     the server using the service-role key after verifying payment. The
--     absence of a policy is deliberate and means deny.
--   * Indexes are created for known access paths only.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type public.order_status as enum (
  'PENDING',
  'PAYMENT_INITIATED',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

create type public.payment_status as enum (
  'CREATED',
  'INITIATED',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

create type public.user_role as enum ('customer', 'admin');

create type public.product_status as enum ('draft', 'published', 'archived');

create type public.access_status as enum ('active', 'revoked', 'expired');

-- -----------------------------------------------------------------------------
-- Utility: updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — extends auth.users
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  company     text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Application-level user profile, 1:1 with auth.users. Role drives admin access.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check as SECURITY DEFINER to avoid RLS recursion when policies on
-- profiles need to ask whether the caller is an admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin reads all"
  on public.profiles for select
  using (public.is_admin());

-- Note: no INSERT policy. Profiles are created by the trigger above
-- (SECURITY DEFINER), never directly by clients.
-- Note: role escalation is prevented because "update own" allows a user to
-- change their own row, but the role column is protected by the trigger below.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role may only be changed by an administrator';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  tagline       text,
  description   text,
  status        public.product_status not null default 'draft',
  -- Storage path within the private products bucket. Never a public URL.
  storage_path  text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.products.storage_path is
  'Path in the PRIVATE Supabase Storage bucket. Access is only ever granted via a short-lived signed URL generated server-side after a product_access check.';

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index products_status_idx on public.products (status);

alter table public.products enable row level security;

create policy "products: anyone reads published"
  on public.products for select
  using (status = 'published');

create policy "products: admin full access"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- product_prices
-- -----------------------------------------------------------------------------

create table public.product_prices (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products(id) on delete cascade,
  currency           char(3) not null,
  -- Minor units. 29900 with currency 'USD' means $299.00.
  unit_amount        bigint not null check (unit_amount >= 0),
  compare_at_amount  bigint check (compare_at_amount is null or compare_at_amount >= 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.product_prices is
  'Prices in minor units. A product may have one active price per currency.';

create unique index product_prices_one_active_per_currency_idx
  on public.product_prices (product_id, currency)
  where is_active;

create index product_prices_product_idx on public.product_prices (product_id);

create trigger product_prices_set_updated_at
  before update on public.product_prices
  for each row execute function public.set_updated_at();

alter table public.product_prices enable row level security;

create policy "product_prices: anyone reads active for published products"
  on public.product_prices for select
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

create policy "product_prices: admin full access"
  on public.product_prices for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- coupons
-- -----------------------------------------------------------------------------

create table public.coupons (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  -- Exactly one of percent_off / amount_off must be set.
  percent_off        smallint check (percent_off between 1 and 100),
  amount_off         bigint check (amount_off > 0),
  currency           char(3),
  max_redemptions    integer check (max_redemptions is null or max_redemptions > 0),
  times_redeemed     integer not null default 0 check (times_redeemed >= 0),
  starts_at          timestamptz,
  expires_at         timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint coupons_one_discount_kind check (
    (percent_off is not null and amount_off is null and currency is null)
    or
    (percent_off is null and amount_off is not null and currency is not null)
  )
);

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;

-- Deliberately no public read policy: coupon validity is checked server-side
-- only. Exposing the coupon table would let anyone enumerate discount codes.
create policy "coupons: admin full access"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  -- Human-facing reference, e.g. AUR-2A7F9C.
  reference         text not null unique,
  user_id           uuid references public.profiles(id) on delete set null,
  email             text not null,
  status            public.order_status not null default 'PENDING',
  currency          char(3) not null,
  -- All amounts in minor units, all computed SERVER-SIDE. The client never
  -- supplies or influences any of these values.
  subtotal_amount   bigint not null check (subtotal_amount >= 0),
  discount_amount   bigint not null default 0 check (discount_amount >= 0),
  tax_amount        bigint not null default 0 check (tax_amount >= 0),
  total_amount      bigint not null check (total_amount >= 0),
  coupon_id         uuid references public.coupons(id) on delete set null,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_total_is_consistent check (
    total_amount = subtotal_amount - discount_amount + tax_amount
  )
);

comment on constraint orders_total_is_consistent on public.orders is
  'Database-level guarantee that the charged total always equals the computed breakdown. Defence in depth against amount tampering.';

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index orders_user_idx on public.orders (user_id);
create index orders_email_idx on public.orders (lower(email));
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "orders: read own"
  on public.orders for select
  using (user_id = auth.uid());

create policy "orders: admin reads all"
  on public.orders for select
  using (public.is_admin());

-- No INSERT/UPDATE policies for customers. Orders are created and transitioned
-- exclusively by the server (service role) after server-side price calculation
-- and payment verification.

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete restrict,
  -- Snapshot of name and price at purchase time, so historical orders stay
  -- accurate even after the product is renamed or repriced.
  product_name      text not null,
  unit_amount       bigint not null check (unit_amount >= 0),
  quantity          integer not null default 1 check (quantity > 0),
  line_total_amount bigint not null check (line_total_amount >= 0),
  created_at        timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

create policy "order_items: read own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "order_items: admin reads all"
  on public.order_items for select
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders(id) on delete restrict,
  provider              text not null default 'safepay',
  -- Safepay tracker token / transaction reference.
  provider_reference    text,
  status                public.payment_status not null default 'CREATED',
  currency              char(3) not null,
  amount                bigint not null check (amount >= 0),
  amount_refunded       bigint not null default 0 check (amount_refunded >= 0),
  failure_reason        text,
  -- Provider payloads only. NEVER card numbers, CVV, or raw card details.
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint payments_refund_within_amount check (amount_refunded <= amount)
);

comment on table public.payments is
  'Payment attempts. Stores provider references only - never card numbers, CVV, or any raw cardholder data. Card data never touches AUREVIA infrastructure because checkout is hosted by the provider.';

create unique index payments_provider_reference_idx
  on public.payments (provider, provider_reference)
  where provider_reference is not null;

create index payments_order_idx on public.payments (order_id);
create index payments_status_idx on public.payments (status);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments: read own"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "payments: admin reads all"
  on public.payments for select
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- webhook_events — idempotency ledger
-- -----------------------------------------------------------------------------

create table public.webhook_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'safepay',
  -- The provider's own event identifier. The unique index below is what makes
  -- webhook processing idempotent: a replayed event cannot be inserted twice.
  provider_event_id text not null,
  event_type        text,
  payload           jsonb not null,
  signature_valid   boolean not null default false,
  processed_at      timestamptz,
  processing_error  text,
  received_at       timestamptz not null default now()
);

comment on table public.webhook_events is
  'Every inbound webhook is recorded here BEFORE it is acted on. The unique index on (provider, provider_event_id) is the idempotency guarantee: a duplicate delivery fails to insert and is acknowledged without re-granting access or double-counting revenue.';

create unique index webhook_events_provider_event_idx
  on public.webhook_events (provider, provider_event_id);

create index webhook_events_processed_idx
  on public.webhook_events (processed_at)
  where processed_at is null;

alter table public.webhook_events enable row level security;

-- No customer access at all. Admin read only; writes are service-role only.
create policy "webhook_events: admin reads all"
  on public.webhook_events for select
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- product_access — the entitlement table
-- -----------------------------------------------------------------------------

create table public.product_access (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete restrict,
  order_id     uuid references public.orders(id) on delete set null,
  status       public.access_status not null default 'active',
  granted_at   timestamptz not null default now(),
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.product_access is
  'The single source of truth for what a customer may download. Rows are created ONLY by the server after a webhook-verified payment - never by the client, and never from a /payment/success page visit.';

create unique index product_access_user_product_order_idx
  on public.product_access (user_id, product_id, order_id);

create index product_access_user_idx on public.product_access (user_id);

create trigger product_access_set_updated_at
  before update on public.product_access
  for each row execute function public.set_updated_at();

alter table public.product_access enable row level security;

create policy "product_access: read own"
  on public.product_access for select
  using (user_id = auth.uid());

create policy "product_access: admin full access"
  on public.product_access for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- refunds
-- -----------------------------------------------------------------------------

create table public.refunds (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete restrict,
  payment_id         uuid not null references public.payments(id) on delete restrict,
  provider_reference text,
  currency           char(3) not null,
  amount             bigint not null check (amount > 0),
  reason             text,
  status             text not null default 'pending',
  requested_by       uuid references public.profiles(id) on delete set null,
  processed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index refunds_order_idx on public.refunds (order_id);
create index refunds_payment_idx on public.refunds (payment_id);

create trigger refunds_set_updated_at
  before update on public.refunds
  for each row execute function public.set_updated_at();

alter table public.refunds enable row level security;

create policy "refunds: read own"
  on public.refunds for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "refunds: admin full access"
  on public.refunds for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- leads — email capture for the lead magnet and funnel
-- -----------------------------------------------------------------------------

create table public.leads (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  full_name      text,
  company        text,
  source         text,
  lead_magnet    text,
  metadata       jsonb not null default '{}'::jsonb,
  confirmed_at   timestamptz,
  unsubscribed_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index leads_email_idx on public.leads (lower(email));
create index leads_created_at_idx on public.leads (created_at desc);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

-- No public policies. Lead capture goes through a server route so it can be
-- rate limited and validated; exposing this table for anon INSERT would allow
-- unbounded spam, and exposing SELECT would leak the email list.
create policy "leads: admin full access"
  on public.leads for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- analytics_events
-- -----------------------------------------------------------------------------

create table public.analytics_events (
  id           bigint generated always as identity primary key,
  user_id      uuid references public.profiles(id) on delete set null,
  session_id   text,
  event_name   text not null,
  product_id   uuid references public.products(id) on delete set null,
  order_id     uuid references public.orders(id) on delete set null,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

comment on table public.analytics_events is
  'Application analytics. Revenue-bearing events (payment_success, purchase_completed) are written server-side only, after verification - never trusted from the client.';

create index analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);
create index analytics_events_user_idx on public.analytics_events (user_id);
create index analytics_events_session_idx on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

create policy "analytics_events: admin reads all"
  on public.analytics_events for select
  using (public.is_admin());

-- =============================================================================
-- Notes on what is deliberately NOT in this migration
-- =============================================================================
-- * subscription_plans / subscriptions - deferred until Aurevia Pro is
--   validated AND Safepay recurring support is confirmed. Building a
--   subscription model against unconfirmed provider capability would be
--   guessing. See docs/safepay-integration.md section 6.
-- * Storage buckets - created in a separate migration alongside their access
--   policies, so bucket and policy always ship together.
-- =============================================================================
