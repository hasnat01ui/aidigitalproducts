import { z } from "zod";

/**
 * Environment validation.
 *
 * Split deliberately into two schemas. `clientEnv` is safe to evaluate
 * anywhere. `serverEnv()` is a function rather than a module-level constant so
 * that merely importing this file from a client component cannot pull server
 * secrets into the browser bundle — the secrets are only read when the
 * function is actually called, which only ever happens on the server.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Referenced explicitly rather than via process.env[key] because Next.js
// inlines NEXT_PUBLIC_* values at build time only for static member accesses.
const clientResult = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!clientResult.success) {
  throw new Error(
    `Invalid public environment variables:\n${clientResult.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}\n\nCopy .env.example to .env.local and fill it in.`,
  );
}

export const clientEnv = clientResult.data;

/**
 * An unset variable in a .env file is an EMPTY STRING, not undefined. Without
 * this, `SAFEPAY_API_KEY=` in .env.local counts as "present but invalid" and
 * fails `.min(1).optional()`, breaking every server route before a merchant
 * account exists. Treat blank as absent.
 */
const optionalSecret = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional(),
  );

const optionalWithDefault = (fallback: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
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
  EMAIL_FROM: optionalWithDefault("AUREVIA <hello@aurevia.example>"),
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
      `Invalid server environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/**
 * Safepay credentials are optional above so the site can be developed, and the
 * lead magnet and email capture can run, before a merchant account exists.
 * Any code path that actually takes money must call this first, so the failure
 * is a loud, early, explicit one rather than a half-completed checkout.
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
