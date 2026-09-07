"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

/**
 * Browser Supabase client. Uses the anon key and is fully subject to RLS.
 * Suitable for auth flows and reading the caller's own rows — never for
 * anything that determines entitlement or money.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
