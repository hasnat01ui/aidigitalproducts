-- =============================================================================
-- AUREVIA — Security hardening for core schema
-- Migration: 20260907130000_harden_functions_and_policies
-- =============================================================================
--
-- Raised by the Supabase security advisor after 20260907120000:
--
--   1. function_search_path_mutable (x2)
--      public.set_updated_at and public.prevent_role_escalation ran with a
--      mutable search_path. A role able to set a session search_path could
--      shadow a referenced object and have it resolved inside our function.
--      Fixed by pinning search_path on both.
--
--   2. anon/authenticated_security_definer_function_executable (x4)
--      public.handle_new_user and public.is_admin were callable as RPC over
--      the REST API by anon and authenticated.
--
--      handle_new_user is a trigger function and has no business being
--      callable at all - EXECUTE is revoked from every API role, leaving it
--      to supabase_auth_admin, which is what actually fires the trigger.
--
--      is_admin is referenced inside RLS policy expressions, which are
--      evaluated with the privileges of the calling role. Revoking EXECUTE
--      outright would break every policy that uses it. The correct fix is
--      two-part:
--        (a) scope every is_admin-using policy TO authenticated, so the anon
--            role never evaluates it; then
--        (b) revoke EXECUTE from anon while keeping it for authenticated.
--      Scoping policies by role is also a performance win: anonymous reads of
--      the product catalogue no longer evaluate admin predicates at all.
--
-- Additive and non-destructive: policies are replaced in place, no data is
-- touched, no table or column is dropped.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Pin search_path on the remaining functions
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role may only be changed by an administrator';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Lock down function execution
-- -----------------------------------------------------------------------------

-- Trigger function only. Nobody should be able to invoke it over the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Needed by RLS policy evaluation for signed-in users; never by anon.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Scope policies by role
-- -----------------------------------------------------------------------------
-- Every policy that calls is_admin() is restricted TO authenticated, so the
-- anon role never evaluates it. Public catalogue reads stay open to anon.

-- profiles
drop policy if exists "profiles: read own"       on public.profiles;
drop policy if exists "profiles: update own"     on public.profiles;
drop policy if exists "profiles: admin reads all" on public.profiles;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin reads all"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

-- products: catalogue stays readable by anon; admin policy is authenticated-only
drop policy if exists "products: anyone reads published" on public.products;
drop policy if exists "products: admin full access"      on public.products;

create policy "products: anyone reads published"
  on public.products for select to anon, authenticated
  using (status = 'published');

create policy "products: admin full access"
  on public.products for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- product_prices
drop policy if exists "product_prices: anyone reads active for published products" on public.product_prices;
drop policy if exists "product_prices: admin full access" on public.product_prices;

create policy "product_prices: anyone reads active for published products"
  on public.product_prices for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

create policy "product_prices: admin full access"
  on public.product_prices for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- coupons
drop policy if exists "coupons: admin full access" on public.coupons;
create policy "coupons: admin full access"
  on public.coupons for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- orders
drop policy if exists "orders: read own"       on public.orders;
drop policy if exists "orders: admin reads all" on public.orders;

create policy "orders: read own"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

create policy "orders: admin reads all"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

-- order_items
drop policy if exists "order_items: read own"       on public.order_items;
drop policy if exists "order_items: admin reads all" on public.order_items;

create policy "order_items: read own"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "order_items: admin reads all"
  on public.order_items for select to authenticated
  using ((select public.is_admin()));

-- payments
drop policy if exists "payments: read own"       on public.payments;
drop policy if exists "payments: admin reads all" on public.payments;

create policy "payments: read own"
  on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "payments: admin reads all"
  on public.payments for select to authenticated
  using ((select public.is_admin()));

-- webhook_events
drop policy if exists "webhook_events: admin reads all" on public.webhook_events;
create policy "webhook_events: admin reads all"
  on public.webhook_events for select to authenticated
  using ((select public.is_admin()));

-- product_access
drop policy if exists "product_access: read own"        on public.product_access;
drop policy if exists "product_access: admin full access" on public.product_access;

create policy "product_access: read own"
  on public.product_access for select to authenticated
  using (user_id = (select auth.uid()));

create policy "product_access: admin full access"
  on public.product_access for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- refunds
drop policy if exists "refunds: read own"         on public.refunds;
drop policy if exists "refunds: admin full access" on public.refunds;

create policy "refunds: read own"
  on public.refunds for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "refunds: admin full access"
  on public.refunds for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- leads
drop policy if exists "leads: admin full access" on public.leads;
create policy "leads: admin full access"
  on public.leads for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- analytics_events
drop policy if exists "analytics_events: admin reads all" on public.analytics_events;
create policy "analytics_events: admin reads all"
  on public.analytics_events for select to authenticated
  using ((select public.is_admin()));

-- =============================================================================
-- Note on (select auth.uid()) and (select public.is_admin())
-- =============================================================================
-- Wrapping these calls in a scalar subquery lets Postgres evaluate them once
-- per statement (an InitPlan) rather than once per row. On tables that will
-- grow - orders, analytics_events - this is a substantial difference, and it
-- costs nothing to do correctly from the start.
-- =============================================================================
