"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadForm({ source = "landing" }: { source?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = new FormData(event.currentTarget);

    // FormData.get() returns null for inputs this form doesn't render, and
    // sending those nulls is what previously tripped server-side validation.
    // Build the payload from fields that are actually present.
    const payload: Record<string, string> = { source };
    for (const field of ["email", "fullName", "company", "website"] as const) {
      const value = form.get(field);
      if (typeof value === "string" && value.trim() !== "") {
        payload[field] = value;
      }
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      // Honest copy: transactional email is not wired up yet, so promising
      // "check your inbox" would be a lie the moment someone submits.
      // Change this line the same day email delivery goes live.
      setMessage(
        "We've saved your place. The audit is being finished now — we'll email it to you the moment it's ready.",
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-[--radius-card] border p-6"
        style={{ background: "var(--surface-raised)" }}
      >
        <p className="font-medium" style={{ color: "var(--color-success)" }}>
          You&rsquo;re on the list.
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {message}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@youragency.com"
          className="min-w-0 flex-1 rounded-[--radius-base] border px-4 py-3 text-base outline-none"
          style={{
            background: "var(--surface-raised)",
            color: "var(--text)",
          }}
        />

        {/* Honeypot — hidden from people, tempting to bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-[--radius-base] px-6 py-3 text-base font-medium transition-opacity disabled:opacity-60"
          style={{ background: "var(--accent-strong)", color: "#0b0d10" }}
        >
          {status === "submitting" ? "Sending…" : "Get the audit"}
        </button>
      </div>

      <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
        Free. No card required. Unsubscribe in one click.
      </p>

      {status === "error" && (
        <p
          role="alert"
          className="mt-2 text-sm"
          style={{ color: "var(--color-danger)" }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
