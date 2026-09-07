/**
 * Time-Recovery Audit — the calculation.
 *
 * Shared by the client (live preview) and the server (authoritative stored
 * result), so the number a visitor sees is the number that gets recorded.
 *
 * Honesty rules baked into this file, because the brand forbids inflated
 * claims and this is where inflation would happen:
 *
 *   1. Recovery rates are DELIBERATELY CONSERVATIVE and vary per task. It
 *      would be trivial to assume "AI saves 80%" and produce a huge, useless
 *      number. A number the buyer doesn't believe is worth less than a smaller
 *      one they do.
 *   2. The cost figure is OPPORTUNITY cost — hours that could have been
 *      billed. It is not cash saved, and the UI must say so.
 *   3. Every assumption is exposed in `AUDIT_ASSUMPTIONS` and rendered on the
 *      page. No hidden multipliers.
 */

export interface AuditTask {
  id: string;
  label: string;
  help: string;
  /**
   * Share of this task's time that a well-implemented AI workflow can
   * realistically remove. Conservative on purpose.
   */
  recoveryRate: number;
  /** Sensible starting value, in hours per person per week. */
  defaultHours: number;
}

export const AUDIT_TASKS: readonly AuditTask[] = [
  {
    id: "proposals",
    label: "Proposals & pitching",
    help: "Scoping, writing, pricing and formatting proposals — including the ones you lose.",
    recoveryRate: 0.6,
    defaultHours: 3,
  },
  {
    id: "onboarding",
    label: "Client onboarding",
    help: "Kickoff docs, access gathering, brand/context capture, setting up the account.",
    recoveryRate: 0.55,
    defaultHours: 2,
  },
  {
    id: "reporting",
    label: "Client reporting & updates",
    help: "Pulling numbers, writing the narrative, formatting the monthly or weekly report.",
    recoveryRate: 0.65,
    defaultHours: 3,
  },
  {
    id: "internal",
    label: "Internal admin & status",
    help: "Status meetings, recaps, timesheets, project hygiene, chasing people.",
    recoveryRate: 0.35,
    defaultHours: 3,
  },
  {
    id: "qa",
    label: "Review & QA",
    help: "Checking work before it reaches the client, and the rework that follows.",
    recoveryRate: 0.25,
    defaultHours: 2,
  },
  {
    id: "docs",
    label: "Documentation & SOPs",
    help: "Writing down how things are done — usually postponed, then done badly in a rush.",
    recoveryRate: 0.7,
    defaultHours: 1,
  },
] as const;

export const AUDIT_ASSUMPTIONS = [
  "4.33 weeks per month (52 weeks ÷ 12), so monthly figures are not inflated by counting 4 or 5 weeks.",
  "Cost is opportunity cost — hours that could have been billed at your rate — not cash you would get back.",
  "Recovery rates are per task and range from 25% to 70%. They are deliberately conservative.",
  "Recovery assumes the workflows are actually adopted by the team. Adoption is the hard part, not the tooling.",
] as const;

export const WEEKS_PER_MONTH = 4.33;

export interface AuditInput {
  teamSize: number;
  /** Major units, e.g. 150 for $150/hour. */
  hourlyRate: number;
  /** hours per person per week, keyed by task id */
  hours: Record<string, number>;
}

export interface AuditTaskResult {
  id: string;
  label: string;
  hoursPerWeekPerPerson: number;
  teamHoursPerMonth: number;
  costPerMonth: number;
  recoverableHoursPerMonth: number;
  recoverableCostPerMonth: number;
  recoveryRate: number;
}

export interface AuditResult {
  teamSize: number;
  hourlyRate: number;
  totalHoursPerWeek: number;
  totalHoursPerMonth: number;
  monthlyCost: number;
  annualCost: number;
  recoverableHoursPerMonth: number;
  recoverableCostPerMonth: number;
  recoverableCostPerYear: number;
  /** Share of a 40-hour week per person spent on non-billable work. */
  shareOfWeek: number;
  tasks: AuditTaskResult[];
}

function clampNumber(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function calculateAudit(input: AuditInput): AuditResult {
  const teamSize = Math.round(clampNumber(input.teamSize, 1, 500));
  const hourlyRate = clampNumber(input.hourlyRate, 0, 10_000);

  const tasks: AuditTaskResult[] = AUDIT_TASKS.map((task) => {
    const hoursPerWeekPerPerson = clampNumber(input.hours?.[task.id], 0, 40);
    const teamHoursPerMonth =
      hoursPerWeekPerPerson * teamSize * WEEKS_PER_MONTH;
    const recoverableHoursPerMonth = teamHoursPerMonth * task.recoveryRate;

    return {
      id: task.id,
      label: task.label,
      recoveryRate: task.recoveryRate,
      hoursPerWeekPerPerson,
      teamHoursPerMonth,
      costPerMonth: teamHoursPerMonth * hourlyRate,
      recoverableHoursPerMonth,
      recoverableCostPerMonth: recoverableHoursPerMonth * hourlyRate,
    };
  });

  const totalHoursPerWeek = tasks.reduce(
    (sum, t) => sum + t.hoursPerWeekPerPerson,
    0,
  );
  const totalHoursPerMonth = tasks.reduce(
    (sum, t) => sum + t.teamHoursPerMonth,
    0,
  );
  const recoverableHoursPerMonth = tasks.reduce(
    (sum, t) => sum + t.recoverableHoursPerMonth,
    0,
  );

  const monthlyCost = totalHoursPerMonth * hourlyRate;
  const recoverableCostPerMonth = recoverableHoursPerMonth * hourlyRate;

  return {
    teamSize,
    hourlyRate,
    totalHoursPerWeek,
    totalHoursPerMonth,
    monthlyCost,
    annualCost: monthlyCost * 12,
    recoverableHoursPerMonth,
    recoverableCostPerMonth,
    recoverableCostPerYear: recoverableCostPerMonth * 12,
    shareOfWeek: Math.min(1, totalHoursPerWeek / 40),
    tasks,
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: hours < 10 ? 1 : 0,
  }).format(hours);
}
