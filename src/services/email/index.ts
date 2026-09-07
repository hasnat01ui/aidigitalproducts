import "server-only";

import { isEmailEnabled, serverEnv } from "@/lib/env";

/**
 * Transactional email.
 *
 * Provider-agnostic by the same reasoning as the payment abstraction: the
 * business logic asks to send a message, and does not care who delivers it.
 *
 * Degrades gracefully. If no API key is configured the send is a logged no-op
 * that returns `{ sent: false }` rather than throwing — capturing a lead must
 * never fail because email is not wired up yet. Callers report honestly to the
 * user based on that flag, so nobody is told "check your inbox" when nothing
 * was sent.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  reason?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailEnabled()) {
    console.info(
      `[email] skipped (no EMAIL_API_KEY): "${input.subject}" -> ${input.to}`,
    );
    return { sent: false, reason: "email_not_configured" };
  }

  const env = serverEnv();

  try {
    // Resend. Swap this block to change provider; nothing above needs to know.
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email] provider rejected send", response.status, body);
      return { sent: false, reason: `provider_error_${response.status}` };
    }

    const data = (await response.json()) as { id?: string };
    return { sent: true, id: data.id };
  } catch (error) {
    // A failed send must not fail the request that triggered it. The lead is
    // already stored; email can be retried.
    console.error("[email] send threw", error);
    return { sent: false, reason: "exception" };
  }
}
