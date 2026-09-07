import "server-only";

import { requireSafepayConfig } from "@/lib/env";
import {
  PaymentProviderError,
  type CreateCheckoutInput,
  type CreateCheckoutResult,
  type PaymentProvider,
  type RefundInput,
  type RefundResult,
  type VerifiedPayment,
  type VerifiedWebhookEvent,
  type WebhookVerificationInput,
} from "@/services/payment/types";

/**
 * Safepay payment provider.
 *
 * ---------------------------------------------------------------------------
 * STATUS: STRUCTURE COMPLETE, WIRE FORMAT UNCONFIRMED.
 * ---------------------------------------------------------------------------
 *
 * The brief is explicit that API endpoints must not be guessed and outdated
 * tutorials must not be copied. Research (docs/safepay-integration.md) has
 * confirmed the *shape* of the integration — create a tracker, redirect to
 * hosted checkout, verify via webhook — but the exact paths, request bodies,
 * and webhook signature algorithm have not been read from the official
 * reference yet, because that requires a merchant account which does not exist.
 *
 * Rather than invent plausible-looking endpoints that would fail in
 * production, every unconfirmed value is marked UNCONFIRMED below and each
 * method throws a descriptive error until it is filled in from
 * https://apidocs.getsafepay.com and https://safepay-docs.netlify.app.
 *
 * This is deliberate. A payment adapter that looks finished but is subtly
 * wrong is far more dangerous than one that refuses to run.
 *
 * To complete this adapter:
 *   1. Provision a Safepay sandbox merchant account.
 *   2. Confirm base URLs, the tracker creation endpoint and body, the hosted
 *      checkout URL format, the verification endpoint, the webhook signature
 *      scheme and header names, and the refund endpoint.
 *   3. Replace each UNCONFIRMED block and delete its throw.
 *   4. Work through docs/safepay-testing.md before enabling production keys.
 */

// UNCONFIRMED — verify against official documentation before use.
const BASE_URLS = {
  sandbox: "https://sandbox.api.getsafepay.com",
  production: "https://api.getsafepay.com",
} as const;

function notImplemented(what: string): never {
  throw new PaymentProviderError(
    `Safepay ${what} is not implemented: the wire format has not been ` +
      `confirmed against official documentation. See ` +
      `src/services/payment/safepay/provider.ts and docs/safepay-integration.md.`,
    "safepay",
  );
}

export class SafepayPaymentProvider implements PaymentProvider {
  readonly name = "safepay";

  private config() {
    // Throws loudly if credentials are absent, so a checkout can never
    // half-start against an unconfigured gateway.
    return requireSafepayConfig();
  }

  private baseUrl(): string {
    return BASE_URLS[this.config().environment];
  }

  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    this.config();

    // Guard rails that hold regardless of wire format. These invariants are
    // the security-critical part and are correct now.
    if (!Number.isInteger(input.total.amount) || input.total.amount <= 0) {
      throw new PaymentProviderError(
        `Refusing to create a checkout for a non-positive or non-integer ` +
          `amount (${input.total.amount}). Amounts must be integer minor units.`,
        this.name,
      );
    }
    void this.baseUrl();

    // UNCONFIRMED — tracker creation and hosted checkout URL construction.
    return notImplemented("checkout creation");
  }

  async verifyPayment(providerReference: string): Promise<VerifiedPayment> {
    this.config();
    void providerReference;
    // UNCONFIRMED — server-to-server payment verification endpoint.
    return notImplemented("payment verification");
  }

  async verifyWebhook(
    input: WebhookVerificationInput,
  ): Promise<VerifiedWebhookEvent> {
    this.config();
    void input;
    // UNCONFIRMED — signature algorithm and header names.
    //
    // When implemented, this MUST:
    //   * compute the expected signature over the RAW request body, never a
    //     re-serialised object (key order and whitespace change the digest);
    //   * compare using a timing-safe comparison, never ===;
    //   * return { signatureValid: false } rather than throwing, so the caller
    //     can persist the rejected attempt for audit before responding.
    return notImplemented("webhook verification");
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    this.config();
    void input;
    // UNCONFIRMED — refund endpoint, and whether partial refunds are supported.
    return notImplemented("refunds");
  }
}
