/**
 * Payment provider abstraction.
 *
 * Business logic talks to `PaymentProvider`, never to Safepay directly.
 *
 * This is not speculative future-proofing. Safepay settles in PKR and is
 * optimised for domestic Pakistani processing, while AUREVIA is priced in USD
 * for a global audience (see docs/safepay-integration.md §5). A second,
 * international provider is a foreseeable requirement, and this boundary is
 * what lets it be added without rewriting checkout, orders, or fulfilment.
 */

/** ISO 4217 alphabetic code, e.g. "USD", "PKR". */
export type CurrencyCode = string;

/**
 * All money in this codebase is an integer in MINOR UNITS.
 * 29900 + "USD" is $299.00. Never floats — binary floating point cannot
 * represent decimal currency exactly, and rounding drift in money is a bug
 * that shows up as real financial discrepancies.
 */
export type MinorUnits = number;

export interface Money {
  amount: MinorUnits;
  currency: CurrencyCode;
}

export interface CheckoutCustomer {
  email: string;
  fullName?: string | null;
}

export interface CreateCheckoutInput {
  /** AUREVIA's internal order id. Round-tripped so webhooks can be correlated. */
  orderId: string;
  /** Human-facing reference shown to the customer, e.g. AUR-2A7F9C. */
  orderReference: string;
  /**
   * The amount to charge. ALWAYS computed server-side from product prices,
   * discounts and tax. A provider implementation must never accept an amount
   * that originated in the browser.
   */
  total: Money;
  customer: CheckoutCustomer;
  /** Where the provider returns the customer after a completed attempt. */
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  /** Provider-side identifier (Safepay: the tracker token). */
  providerReference: string;
  /** Absolute URL to redirect the customer to. */
  redirectUrl: string;
}

export type VerifiedPaymentStatus =
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "PENDING";

/**
 * The result of asking the provider — not the browser — what actually
 * happened. Returning to /payment/success proves nothing and must never be
 * used to grant access.
 */
export interface VerifiedPayment {
  providerReference: string;
  status: VerifiedPaymentStatus;
  /** As reported by the provider, for comparison against the order. */
  paid: Money;
  orderId?: string | null;
  failureReason?: string | null;
  raw: unknown;
}

export interface WebhookVerificationInput {
  rawBody: string;
  headers: Record<string, string | undefined>;
}

export interface VerifiedWebhookEvent {
  /** Provider's own event id. The idempotency key. */
  eventId: string;
  eventType: string;
  signatureValid: boolean;
  payload: unknown;
  payment?: VerifiedPayment | null;
}

export interface RefundInput {
  providerReference: string;
  amount: Money;
  reason?: string;
}

export interface RefundResult {
  providerRefundReference: string;
  status: "pending" | "succeeded" | "failed";
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  /** Create a hosted checkout session and return where to send the customer. */
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;

  /**
   * Ask the provider directly for the authoritative state of a payment.
   * This is the only acceptable basis for granting product access.
   */
  verifyPayment(providerReference: string): Promise<VerifiedPayment>;

  /**
   * Verify authenticity of an inbound webhook and normalise it.
   * MUST return signatureValid=false rather than throwing on a bad signature,
   * so the caller can record the attempt before rejecting it.
   */
  verifyWebhook(input: WebhookVerificationInput): Promise<VerifiedWebhookEvent>;

  refund(input: RefundInput): Promise<RefundResult>;
}

/** Thrown when a provider call fails in a way the caller should surface. */
export class PaymentProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PaymentProviderError";
  }
}
