import { NextResponse } from "next/server";
import { z } from "zod";

import { AUDIT_TASKS, calculateAudit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/services/email";
import { auditResultEmail } from "@/services/email/templates";

/**
 * Time-Recovery Audit submission.
 *
 * The result is recalculated here from the raw inputs rather than trusting the
 * numbers the browser computed. Same reasoning as order totals: anything the
 * client sends is a suggestion, not a fact. It also guarantees stored results
 * stay consistent if the calculation is later refined.
 */

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const schema = z.object({
  teamSize: z.number().int().min(1).max(500),
  hourlyRate: z.number().min(0).max(10_000),
  hours: z.record(z.string(), z.number().min(0).max(40)),
  email: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    z.string().trim().toLowerCase().email().max(320).optional(),
  ),
  source: optionalText(80),
  // Honeypot — see the leads route for why this is not validated as empty.
  website: optionalText(200),
});

/** Currency minor units. Rounded once, at the boundary. */
function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

export async function POST(request: Request) {
  const limit = rateLimit(`audit:${clientIp(request)}`, {
    max: 10,
    windowMs: 60_000,
  });

  if (limit.limited) {
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
    console.warn(
      "[audit] validation failed",
      parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    );
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === "email");
    return NextResponse.json(
      {
        error: emailIssue
          ? "Please enter a valid email address."
          : "We couldn't process those numbers. Please check them and try again.",
      },
      { status: 400 },
    );
  }

  const { teamSize, hourlyRate, hours, email, source, website } = parsed.data;

  // Honeypot tripped — respond as success so bots learn nothing.
  if (website) {
    return NextResponse.json({ ok: true, emailed: false });
  }

  // Authoritative recalculation.
  const result = calculateAudit({ teamSize, hourlyRate, hours });

  const supabase = createSupabaseAdminClient();

  let leadId: string | null = null;

  if (email) {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .upsert(
        {
          email,
          source: source ?? "audit",
          lead_magnet: "time-recovery-audit",
        },
        { onConflict: "email", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (leadError) {
      console.error("[audit] lead upsert failed", leadError);
    } else {
      leadId = lead?.id ?? null;
    }
  }

  const { error: auditError } = await supabase.from("audit_responses").insert({
    lead_id: leadId,
    email: email ?? null,
    team_size: result.teamSize,
    hourly_rate_minor: toMinor(result.hourlyRate),
    currency: "USD",
    billable_hours_target: 40,
    task_breakdown: AUDIT_TASKS.map((task) => ({
      id: task.id,
      label: task.label,
      hoursPerWeek: hours[task.id] ?? 0,
    })),
    total_hours_per_week: result.totalHoursPerWeek,
    total_hours_per_month: result.totalHoursPerMonth,
    monthly_cost_minor: toMinor(result.monthlyCost),
    annual_cost_minor: toMinor(result.annualCost),
    recoverable_hours_per_month: result.recoverableHoursPerMonth,
    recoverable_cost_minor: toMinor(result.recoverableCostPerMonth),
    source: source ?? "audit",
  });

  if (auditError) {
    console.error("[audit] insert failed", auditError);
    return NextResponse.json(
      { error: "Something went wrong saving your result. Please try again." },
      { status: 500 },
    );
  }

  await supabase.from("analytics_events").insert({
    event_name: "audit_completed",
    metadata: {
      source: source ?? "audit",
      team_size: result.teamSize,
      has_email: Boolean(email),
    },
  });

  // Email is best-effort. The result is already saved, so a delivery failure
  // must not fail the request — but we report honestly whether it went.
  let emailed = false;
  if (email) {
    const template = auditResultEmail(result);
    const sendResult = await sendEmail({ to: email, ...template });
    emailed = sendResult.sent;

    if (sendResult.sent) {
      await supabase.from("analytics_events").insert({
        event_name: "audit_emailed",
        metadata: { provider_id: sendResult.id ?? null },
      });
    }
  }

  return NextResponse.json({ ok: true, emailed });
}
