import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Lead capture for the free Time-Recovery Audit.
 *
 * Uses the service-role client because the `leads` table deliberately has no
 * anon INSERT policy — allowing direct anonymous writes would let anyone spam
 * the table or enumerate it. Validation and rate limiting therefore live here,
 * in the one place that can enforce them.
 */

/**
 * Optional text field.
 *
 * `FormData.get()` returns `null` for an input that is not present in the DOM,
 * and JSON.stringify keeps that null. So a browser form that only renders an
 * email input still POSTs `{ fullName: null, company: null }`. Plain
 * `.optional()` rejects null (it only permits `undefined`), which made every
 * real form submission fail with a misleading "invalid email" error while
 * curl — which omitted the keys entirely — passed.
 *
 * Treat null, undefined, and blank uniformly as "not supplied".
 */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z.string().trim().max(max).optional(),
  );

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  fullName: optionalText(120),
  company: optionalText(160),
  source: optionalText(80),
  // Honeypot: a real user never fills a hidden field. Bots usually do.
  // Accepts any string here on purpose — validating it as empty would reject
  // the request with a 400 and tell the bot exactly which field tripped it.
  // The handler checks it below and returns a silent success instead.
  website: optionalText(200),
});

/**
 * In-memory rate limiter. Adequate for a single instance and for launch
 * traffic; replace with a shared store (Upstash/Redis) before scaling to
 * multiple instances, since each instance keeps its own counter.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Report the field that actually failed. Blaming the email for every
    // validation error hides real bugs behind a plausible-looking message.
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === "email");

    console.warn(
      "[leads] validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    );

    return NextResponse.json(
      {
        error: emailIssue
          ? "Please enter a valid email address."
          : "We couldn't process that. Please check the form and try again.",
      },
      { status: 400 },
    );
  }

  const { email, fullName, company, source, website } = parsed.data;

  // Honeypot tripped. Respond as success so bots get no signal.
  if (website) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseAdminClient();

  /**
   * PostgREST's upsert only SETs the columns present in the payload, so
   * omitting a field preserves whatever is already stored. Optional fields are
   * therefore included only when the visitor actually supplied one.
   *
   * Sending `full_name: null` instead would overwrite a previously captured
   * name whenever someone submits the short form again — losing the data we
   * need to personalise the funnel emails.
   */
  const row: Record<string, string> = {
    email,
    source: source ?? "landing",
    lead_magnet: "time-recovery-audit",
  };
  if (fullName) row.full_name = fullName;
  if (company) row.company = company;

  const { error } = await supabase
    .from("leads")
    .upsert(row, { onConflict: "email", ignoreDuplicates: false });

  if (error) {
    // Log server-side; never leak database detail to the client.
    console.error("[leads] insert failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  await supabase.from("analytics_events").insert({
    event_name: "lead_created",
    metadata: { source: source ?? "landing", lead_magnet: "time-recovery-audit" },
  });

  return NextResponse.json({ ok: true });
}
