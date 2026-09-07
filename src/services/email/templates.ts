import "server-only";

import type { AuditResult } from "@/lib/audit";
import { formatHours, formatUsd } from "@/lib/audit";
import { absoluteUrl, site } from "@/lib/site";

/**
 * Email templates.
 *
 * Plain, table-free, inline-styled HTML with a real text alternative. Email
 * clients are a hostile rendering environment; restraint travels better than
 * design. Every template ships text alongside HTML — text-only clients and
 * spam scoring both punish HTML-only mail.
 *
 * Content rule: these say only what is true. No fabricated urgency, no
 * "thousands of agencies", no results we have not measured.
 */

const wrapper = (inner: string) => `
<div style="margin:0;padding:24px;background:#f7f8fa;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #edeff3;border-radius:14px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0b0d10;line-height:1.6;">
    <p style="margin:0 0 24px;font-size:14px;font-weight:600;letter-spacing:0.14em;color:#8f7318;">AUREVIA</p>
    ${inner}
    <hr style="border:none;border-top:1px solid #edeff3;margin:32px 0 16px;" />
    <p style="margin:0;font-size:12px;color:#5a6472;">
      ${site.name} — ${site.tagline}<br />
      You received this because you requested it at ${site.url}.
      <a href="${absoluteUrl("/contact")}" style="color:#8f7318;">Unsubscribe or contact us</a>.
    </p>
  </div>
</div>`.trim();

export function auditResultEmail(result: AuditResult) {
  const rows = result.tasks
    .slice()
    .sort((a, b) => b.costPerMonth - a.costPerMonth)
    .map(
      (t) =>
        `<li style="margin:0 0 6px;"><strong>${t.label}</strong> — ${formatHours(
          t.teamHoursPerMonth,
        )} hrs/mo · ${formatUsd(t.costPerMonth)}</li>`,
    )
    .join("");

  const html = wrapper(`
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Your Time-Recovery Audit</h1>

    <p style="margin:0 0 20px;">Here is your result. Keep it — it is the baseline you measure against later.</p>

    <div style="background:#f7f8fa;border-radius:10px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#5a6472;">Non-billable work</p>
      <p style="margin:0 0 16px;font-size:28px;font-weight:600;">${formatHours(result.totalHoursPerMonth)} hrs / month</p>

      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#5a6472;">Opportunity cost at ${formatUsd(result.hourlyRate)}/hr</p>
      <p style="margin:0 0 16px;font-size:28px;font-weight:600;color:#8f7318;">${formatUsd(result.monthlyCost)} / month</p>

      <p style="margin:0;font-size:14px;color:#5a6472;">That is ${formatUsd(result.annualCost)} a year, across ${result.teamSize} ${result.teamSize === 1 ? "person" : "people"}.</p>
    </div>

    <p style="margin:0 0 8px;font-weight:600;">Where it goes</p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;">${rows}</ul>

    <p style="margin:0 0 20px;">
      Realistically recoverable: <strong>${formatHours(result.recoverableHoursPerMonth)} hrs</strong>
      (${formatUsd(result.recoverableCostPerMonth)}) a month, using conservative per-task rates of 25–70%.
    </p>

    <p style="margin:0 0 20px;font-size:14px;color:#5a6472;">
      This is an estimate from your inputs, not a measurement, and the cost is
      billable capacity rather than cash. If the number looks small, you
      probably do not have this problem — that is a useful answer too.
    </p>

    <p style="margin:0 0 8px;">We are building the system that recovers these hours. You will hear from us as it ships — no more than a couple of emails a month.</p>
  `);

  const text = `Your Time-Recovery Audit

Non-billable work: ${formatHours(result.totalHoursPerMonth)} hrs/month
Opportunity cost:  ${formatUsd(result.monthlyCost)}/month (${formatUsd(result.annualCost)}/year)
Team size:         ${result.teamSize}
Rate used:         ${formatUsd(result.hourlyRate)}/hr

Where it goes:
${result.tasks
  .slice()
  .sort((a, b) => b.costPerMonth - a.costPerMonth)
  .map(
    (t) =>
      `  - ${t.label}: ${formatHours(t.teamHoursPerMonth)} hrs/mo, ${formatUsd(t.costPerMonth)}`,
  )
  .join("\n")}

Realistically recoverable: ${formatHours(result.recoverableHoursPerMonth)} hrs (${formatUsd(
    result.recoverableCostPerMonth,
  )}) per month, using conservative per-task rates of 25-70%.

This is an estimate from your inputs, not a measurement, and the cost is
billable capacity rather than cash.

${site.name} - ${site.tagline}
${site.url}`;

  return {
    subject: `Your agency is losing ${formatHours(result.totalHoursPerMonth)} hours a month`,
    html,
    text,
  };
}
