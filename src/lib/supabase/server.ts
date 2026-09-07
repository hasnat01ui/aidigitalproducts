import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { clientEnv, serverEnv } from "@/lib/env";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers. Runs as the signed-in user, so RLS applies. This is the
 * default — reach for it unless you specifically need to bypass RLS.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Session refresh is handled
            // by the middleware, so this is safe to ignore here.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. BYPASSES ALL ROW LEVEL SECURITY.
 *
 * `import "server-only"` at the top of this module makes it a build error to
 * import this file from a client component, so the key cannot leak into the
 * browser bundle by accident.
 *
 * Use ONLY for trusted server-side work that genuinely cannot run as the user:
 *   - creating orders after server-side price calculation
 *   - recording payments and webhook events
 *   - granting product access after a verified payment
 *   - lead capture from anonymous visitors
 *
 * Every call site must do its own authorization check first. This client will
 * not stop you doing something wrong.
 */
export function createSupabaseAdminClient() {
  return createClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
