import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";
import {
  PaymentProviderError,
  type CreateCheckoutInput,
  type CreateCheckoutResult,
  type PaymentProvider,
  type RefundInput,
  type RefundResult,
  type VerifiedPayment,
  type VerifiedPaymentStatus,
  type VerifiedWebhookEvent,
  type WebhookVerificationInput,
} from "@/services/payment/types";

/**
 * Paddle Billing — the international payment provider.
 *
 * WHY PADDLE, AND WHY IT IS NOT A REPLACEMENT FOR SAFEPAY
 * -------------------------------------------------------
 * Safepay remains the primary gateway and the one used for Pakistani
 * customers. Paddle is added because AUREVIA is priced in USD for a global
 * audience (decision D8), and that creates a problem Safepay cannot solve:
 *
 *   Selling digital products internationally makes you liable for
 *   consumption tax in the buyer's jurisdiction — EU VAT, UK VAT, US state
 *   sales tax, AU/CA GST. A small Pakistani company cannot realistically
 *   register and file in 30+ jurisdictions.
 *
 * Paddle is a **Merchant of Record**: it becomes the legal seller, and
 * calculates, collects and remits those taxes. That is the actual reason for
 * choosing it — not the payment processing, which Safepay also does.
 *
 * Cost: ~5% + $0.50 per transaction. Materially more than Safepay's
 * 2.9%–3.2% + Rs 30, and that difference is the price of tax compliance and
 * of not having to build it. Recorded in business/pricing.md.
 *
 * WIRE FORMAT
 * -----------
 * Verified against official documentation:
 *   - Sandbox base URL: https://sandbox-api.paddle.com
 *   - Webhook header `Paddle-Signature`, format `ts=<unix>;h1=<hex>`
 *   - Signed payload is `${ts}:${rawBody}` hashed HMAC-SHA256 with the
 *     notification-destination secret, compared timing-safely
 *
 * One value is inferred rather than read from the docs and is flagged below:
 * the production base URL. Confirm it before switching live keys.
 */

const SANDBOX_BASE_URL = "https://sandbox-api.paddle.com";
// INFERRED from the sandbox host pattern — confirm in the Paddle dashboard
// before production go-live. Everything else here is documented.
const PRODUCTION_BASE_URL = "https://api.paddle.com";

/** Reject webhooks older than this to blunt replay attacks. */
const MAX_SIGNATURE_AGE_SECONDS = 300;

interface PaddleConfig {
  apiKey: string;
  webhookSecret: string;
  environment: "sandbox" | "production";
}

function paddleConfig(): PaddleConfig {
  const env = serverEnv();

  if (!env.PADDLE_API_KEY) {
    throw new PaymentProviderError(
      "Paddle is not configured. Set PADDLE_API_KEY. " +
        "International payments are disabled until then.",
      "paddle",
    );
  }

  return {
    apiKey: env.PADDLE_API_KEY,
    webhookSecret: env.PADDLE_WEBHOOK_SECRET ?? "",
    environment: env.PADDLE_ENVIRONMENT,
  };
}

function baseUrl(environment: PaddleConfig["environment"]): string {
  return environment === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
}

/** Paddle transaction status -> our normalised status. */
function mapStatus(status: string | undefined): VerifiedPaymentStatus {
  switch (status) {
    case "completed":
    case "paid":
      return "SUCCEEDED";
    case "canceled":
    case "cancelled":
      return "CANCELLED";
    case "past_due":
      return "FAILED";
    case "draft":
    case "ready":
    case "billed":
      return "PENDING";
    default:
      return "PENDING";
  }
}

interface PaddleTransaction {
  id?: string;
  status?: string;
  currency_code?: string;
  checkout?: { url?: string | null } | null;
  custom_data?: Record<string, unknown> | null;
  details?: { totals?: { total?: string; grand_total?: string } } | null;
}

export class PaddlePaymentProvider implements PaymentProvider {
  readonly name = "paddle";

  private async request<T>(
    path: string,
    init: RequestInit & { method: string },
  ): Promise<T> {
    const config = paddleConfig();

    const response = await fetch(`${baseUrl(config.environment)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();

    if (!response.ok) {
      throw new PaymentProviderError(
        `Paddle ${init.method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`,
        this.name,
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new PaymentProviderError(
        `Paddle returned a non-JSON response for ${path}`,
        this.name,
      );
    }
  }

  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    // Invariants that hold regardless of provider. The amount always comes
    // from server-side calculation; this is a last line of defence.
    if (!Number.isInteger(input.total.amount) || input.total.amount <= 0) {
      throw new PaymentProviderError(
        `Refusing to create a checkout for a non-positive or non-integer amount ` +
          `(${input.total.amount}). Amounts must be integer minor units.`,
        this.name,
      );
    }

    const payload = {
      items: [
        {
          quantity: 1,
          price: {
            description: input.orderReference,
            name: input.orderReference,
            // Paddle takes amounts as a STRING in minor units.
            unit_price: {
              amount: String(input.total.amount),
              currency_code: input.total.currency.toUpperCase(),
            },
          },
        },
      ],
      // Round-tripped back to us on the webhook so the payment can be
      // correlated to our order without trusting anything from the browser.
      custom_data: {
        order_id: input.orderId,
        order_reference: input.orderReference,
      },
      customer: { email: input.customer.email },
      checkout: { url: input.successUrl },
    };

    const result = await this.request<{ data: PaddleTransaction }>(
      "/transactions",
      { method: "POST", body: JSON.stringify(payload) },
    );

    const transaction = result.data;
    const redirectUrl = transaction.checkout?.url;

    if (!transaction.id || !redirectUrl) {
      throw new PaymentProviderError(
        "Paddle did not return a checkout URL. Check that a default payment " +
          "link is configured for this Paddle account.",
        this.name,
      );
    }

    return { providerReference: transaction.id, redirectUrl };
  }

  async verifyPayment(providerReference: string): Promise<VerifiedPayment> {
    const result = await this.request<{ data: PaddleTransaction }>(
      `/transactions/${encodeURIComponent(providerReference)}`,
      { method: "GET" },
    );

    const transaction = result.data;
    const totals = transaction.details?.totals;
    const rawTotal = totals?.grand_total ?? totals?.total ?? "0";

    return {
      providerReference,
      status: mapStatus(transaction.status),
      paid: {
        amount: Number.parseInt(rawTotal, 10) || 0,
        currency: (transaction.currency_code ?? "USD").toUpperCase(),
      },
      orderId:
        (transaction.custom_data?.order_id as string | undefined) ?? null,
      raw: transaction,
    };
  }

  async verifyWebhook(
    input: WebhookVerificationInput,
  ): Promise<VerifiedWebhookEvent> {
    const config = paddleConfig();
    const header = input.headers["paddle-signature"];

    const invalid = (payload: unknown): VerifiedWebhookEvent => ({
      eventId: "",
      eventType: "",
      signatureValid: false,
      payload,
      payment: null,
    });

    if (!header || !config.webhookSecret) return invalid(null);

    // Header format: ts=<unix>;h1=<hex>
    const parts = Object.fromEntries(
      header.split(";").map((segment) => {
        const [key, ...rest] = segment.split("=");
        return [key.trim(), rest.join("=").trim()];
      }),
    );

    const ts = parts.ts;
    const h1 = parts.h1;
    if (!ts || !h1) return invalid(null);

    // Reject stale signatures (replay protection).
    const age = Math.abs(Date.now() / 1000 - Number(ts));
    if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_SECONDS) {
      return invalid(null);
    }

    // Signed payload is `${ts}:${rawBody}` — the RAW body, never re-serialised.
    const expected = createHmac("sha256", config.webhookSecret)
      .update(`${ts}:${input.rawBody}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(h1, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return invalid(null);
    }

    let body: {
      event_id?: string;
      event_type?: string;
      data?: PaddleTransaction;
    };
    try {
      body = JSON.parse(input.rawBody);
    } catch {
      return invalid(null);
    }

    const data = body.data;
    const totals = data?.details?.totals;
    const rawTotal = totals?.grand_total ?? totals?.total ?? "0";

    return {
      eventId: body.event_id ?? "",
      eventType: body.event_type ?? "",
      signatureValid: true,
      payload: body,
      payment: data?.id
        ? {
            providerReference: data.id,
            status: mapStatus(data.status),
            paid: {
              amount: Number.parseInt(rawTotal, 10) || 0,
              currency: (data.currency_code ?? "USD").toUpperCase(),
            },
            orderId: (data.custom_data?.order_id as string | undefined) ?? null,
            raw: data,
          }
        : null,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const result = await this.request<{ data: { id?: string; status?: string } }>(
      "/adjustments",
      {
        method: "POST",
        body: JSON.stringify({
          action: "refund",
          transaction_id: input.providerReference,
          reason: input.reason ?? "Customer requested refund",
          type: "full",
        }),
      },
    );

    return {
      providerRefundReference: result.data.id ?? "",
      status: result.data.status === "approved" ? "succeeded" : "pending",
      raw: result.data,
    };
  }
}
