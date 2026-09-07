import { z } from "zod";

/**
 * Environment validation.
 *
 * Design rule: **validation is lazy, never at module load.**
 *
 * An earlier version parsed and threw at import time. Next.js imports every
 * route module while collecting page data during `next build`, so a missing
 * variable killed the *build* rather than the request — and on Vercel that
 * surfaces only as "The deployment failed because of a project or build
 * error", with the real cause buried in the log.
 *
 * A build should not require runtime secrets. It should compile, deploy, and
 * then fail loudly and specifically on the first request that actually needs a
 * missing value. That is what this module now does.
 *
 * The client/server split is preserved: server secrets are read inside a
 * function, so importing this file from a client component cannot pull them
 * into the browser bundle.
 */

/* -------------------------------------------------------------------------- */
/*  Public (browser-safe) variables                                            */
/* -------------------------------------------------------------------------- */

/**
 * Read as static member accesses so Next.js can inline the values at build
 * time. `process.env[key]` would not be replaced and would be undefined in the
 * browser.
 */
const rawClientEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientSchema>;

/** Raw values. May be empty during build. Prefer `requireClientEnv()`. */
export const clientEnv = rawClientEnv;

let cachedClientEnv: ClientEnv | null = null;

/**
 * Validated public config. Call at the point of use — never at module scope.
 * Throws a message naming exactly which variables are missing.
 */
export function requireClientEnv(): ClientEnv {
  if (cachedClientEnv) return cachedClientEnv;

  const parsed = clientSchema.safeParse(rawClientEnv);
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid public environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}\n\n` +
        `Locally: copy .env.example to .env.local and fill it in.\n` +
        `On Vercel: Project Settings > Environment Variables, then redeploy.`,
    );
  }

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}

/** Non-throwing check, for rendering a helpful message instead of crashing. */
export function isSupabaseConfigured(): boolean {
  return clientSchema.safeParse(rawClientEnv).success;
}

/* -------------------------------------------------------------------------- */
/*  Server-only variables                                                      */
/* -------------------------------------------------------------------------- */

/**
 * An unset variable in a .env file is an EMPTY STRING, not undefined. Without
 * this, `SAFEPAY_API_KEY=` counts as "present but invalid" and fails
 * `.min(1).optional()`. Treat blank as absent.
 */
const optionalSecret = () =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().min(1).optional(),
  );

const optionalWithDefault = (fallback: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().default(fallback),
  );

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SAFEPAY_ENVIRONMENT: optionalWithDefault("sandbox").pipe(
    z.enum(["sandbox", "production"]),
  ),
  SAFEPAY_API_KEY: optionalSecret(),
  SAFEPAY_SECRET_KEY: optionalSecret(),
  SAFEPAY_WEBHOOK_SECRET: optionalSecret(),
  ANTHROPIC_API_KEY: optionalSecret(),
  AI_MODEL: optionalWithDefault("claude-sonnet-5"),
  EMAIL_API_KEY: optionalSecret(),
  EMAIL_FROM: optionalWithDefault("AUREVIA <hello@aurevia.com>"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser. This is a bug.");
  }

  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid server environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}\n\n` +
        `On Vercel: Project Settings > Environment Variables. ` +
        `Mark SUPABASE_SERVICE_ROLE_KEY as Sensitive.`,
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/* -------------------------------------------------------------------------- */
/*  Feature gates                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Safepay credentials are optional so the site can run — and leads can be
 * captured — before a merchant account exists. Any code path that takes money
 * calls this first, so failure is loud and early rather than a half-finished
 * checkout.
 */
export function requireSafepayConfig() {
  const env = serverEnv();
  const missing = (
    ["SAFEPAY_API_KEY", "SAFEPAY_SECRET_KEY", "SAFEPAY_WEBHOOK_SECRET"] as const
  ).filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Safepay is not configured. Missing: ${missing.join(", ")}. ` +
        `Payments are disabled until a merchant account is provisioned.`,
    );
  }

  return {
    environment: env.SAFEPAY_ENVIRONMENT,
    apiKey: env.SAFEPAY_API_KEY!,
    secretKey: env.SAFEPAY_SECRET_KEY!,
    webhookSecret: env.SAFEPAY_WEBHOOK_SECRET!,
  };
}

export function isPaymentsEnabled(): boolean {
  try {
    requireSafepayConfig();
    return true;
  } catch {
    return false;
  }
}

export function isEmailEnabled(): boolean {
  try {
    return Boolean(serverEnv().EMAIL_API_KEY);
  } catch {
    return false;
  }
}
