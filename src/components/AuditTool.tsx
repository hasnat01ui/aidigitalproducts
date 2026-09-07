"use client";

import { useMemo, useState } from "react";

import {
  AUDIT_ASSUMPTIONS,
  AUDIT_TASKS,
  calculateAudit,
  formatHours,
  formatUsd,
} from "@/lib/audit";

type SaveState = "idle" | "saving" | "saved" | "error";

const numberField =
  "w-full rounded-[--radius-base] border px-3 py-2 text-base outline-none";

export function AuditTool() {
  const [teamSize, setTeamSize] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(120);
  const [hours, setHours] = useState<Record<string, number>>(() =>
    Object.fromEntries(AUDIT_TASKS.map((t) => [t.id, t.defaultHours])),
  );

  const [email, setEmail] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  // Recomputed live. Same function the server uses, so the number shown is
  // the number stored.
  const result = useMemo(
    () => calculateAudit({ teamSize, hourlyRate, hours }),
    [teamSize, hourlyRate, hours],
  );

  const maxTaskCost = Math.max(...result.tasks.map((t) => t.costPerMonth), 1);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setSaveMessage("");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamSize,
          hourlyRate,
          hours,
          email: email.trim() || undefined,
          source: "audit-page",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveState("error");
        setSaveMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSaveState("saved");
      setSaveMessage(
        data.emailed
          ? "Sent — check your inbox for your copy."
          : "Saved. We'll send your copy as soon as email delivery is switched on.",
      );
    } catch {
      setSaveState("error");
      setSaveMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ------------------------------------------------------------ Inputs */}
      <section aria-labelledby="inputs-heading">
        <h2 id="inputs-heading" className="text-2xl">
          Your agency
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="teamSize" className="text-sm font-medium">
              People doing client work
            </label>
            <input
              id="teamSize"
              type="number"
              min={1}
              max={500}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className={`mt-2 ${numberField}`}
              style={{ background: "var(--surface-raised)", color: "var(--text)" }}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Include yourself and contractors.
            </p>
          </div>

          <div>
            <label htmlFor="hourlyRate" className="text-sm font-medium">
              Average billable rate (USD/hour)
            </label>
            <input
              id="hourlyRate"
              type="number"
              min={0}
              max={10000}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className={`mt-2 ${numberField}`}
              style={{ background: "var(--surface-raised)", color: "var(--text)" }}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              What you charge, not what you pay.
            </p>
          </div>
        </div>

        <h3 className="mt-10 text-lg font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
          Hours per person, per week
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Estimate is fine. Most owners under-guess these — if you are torn
          between two numbers, the higher one is usually closer.
        </p>

        <div className="mt-6 space-y-6">
          {AUDIT_TASKS.map((task) => (
            <div key={task.id}>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={`task-${task.id}`} className="text-sm font-medium">
                  {task.label}
                </label>
                <span
                  className="text-sm tabular-nums"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  {formatHours(hours[task.id] ?? 0)} hrs
                </span>
              </div>

              <input
                id={`task-${task.id}`}
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={hours[task.id] ?? 0}
                onChange={(e) =>
                  setHours((prev) => ({
                    ...prev,
                    [task.id]: Number(e.target.value),
                  }))
                }
                className="mt-2 w-full"
                style={{ accentColor: "var(--accent-strong)" }}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {task.help}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- Results */}
      <section aria-labelledby="results-heading" aria-live="polite">
        <div
          className="sticky top-24 rounded-[--radius-card] border p-6"
          style={{ background: "var(--surface-raised)" }}
        >
          <h2 id="results-heading" className="text-2xl">
            Your result
          </h2>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
              Non-billable work, per month
            </p>
            <p
              className="mt-1 text-4xl tabular-nums"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatHours(result.totalHoursPerMonth)} hrs
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              across {result.teamSize}{" "}
              {result.teamSize === 1 ? "person" : "people"} — about{" "}
              {Math.round(result.shareOfWeek * 100)}% of each 40-hour week
            </p>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
              Opportunity cost at {formatUsd(result.hourlyRate)}/hr
            </p>
            <p
              className="mt-1 text-4xl tabular-nums"
              style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
            >
              {formatUsd(result.monthlyCost)}
              <span className="text-base" style={{ color: "var(--text-muted)" }}>
                {" "}
                / month
              </span>
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {formatUsd(result.annualCost)} a year
            </p>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
              Realistically recoverable
            </p>
            <p className="mt-1 text-2xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
              {formatHours(result.recoverableHoursPerMonth)} hrs ·{" "}
              {formatUsd(result.recoverableCostPerMonth)} / month
            </p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Using conservative per-task recovery rates (25–70%), not a flat
              optimistic figure. This assumes the workflows are actually
              adopted — which is the hard part.
            </p>
          </div>

          {/* Breakdown */}
          <div className="mt-6 border-t pt-6">
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
              Where it goes
            </p>
            <ul className="mt-4 space-y-3">
              {result.tasks
                .slice()
                .sort((a, b) => b.costPerMonth - a.costPerMonth)
                .map((task) => (
                  <li key={task.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>{task.label}</span>
                      <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {formatUsd(task.costPerMonth)}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--surface-sunken)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(task.costPerMonth / maxTaskCost) * 100}%`,
                          background: "var(--accent-strong)",
                        }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Save / email */}
          <form onSubmit={handleSave} className="mt-8 border-t pt-6">
            <label htmlFor="audit-email" className="text-sm font-medium">
              Want a copy? (optional)
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="audit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@youragency.com"
                autoComplete="email"
                className="min-w-0 flex-1 rounded-[--radius-base] border px-3 py-2 outline-none"
                style={{ background: "var(--surface)", color: "var(--text)" }}
              />
              <button
                type="submit"
                disabled={saveState === "saving"}
                className="rounded-[--radius-base] px-5 py-2 font-medium disabled:opacity-60"
                style={{ background: "var(--accent-strong)", color: "#0b0d10" }}
              >
                {saveState === "saving" ? "Saving…" : "Email it to me"}
              </button>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Your number is already above — the email is just a copy. We do not
              hide the result behind a form.
            </p>
            {saveMessage && (
              <p
                role="status"
                className="mt-2 text-sm"
                style={{
                  color:
                    saveState === "error"
                      ? "var(--color-danger)"
                      : "var(--color-success)",
                }}
              >
                {saveMessage}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------- Assumptions */}
      <section className="lg:col-span-2">
        <div
          className="rounded-[--radius-card] border p-6"
          style={{ background: "var(--surface-sunken)" }}
        >
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-sans)" }}>
            What this assumes
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {AUDIT_ASSUMPTIONS.map((assumption) => (
              <li key={assumption}>— {assumption}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            This is an estimate built from your inputs, not a measurement. If
            the number looks small, you probably do not have this problem —
            and we would rather you found that out here, for free.
          </p>
        </div>
      </section>
    </div>
  );
}
