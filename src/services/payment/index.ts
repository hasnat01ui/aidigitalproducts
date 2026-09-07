import "server-only";

import { SafepayPaymentProvider } from "@/services/payment/safepay/provider";
import type { PaymentProvider } from "@/services/payment/types";

export * from "@/services/payment/types";

let cached: PaymentProvider | null = null;

/**
 * The single entry point business logic uses to reach a payment gateway.
 *
 * Safepay is the primary and currently only provider. When an international
 * provider is added, it is selected here — by currency, region, or
 * configuration — and nothing upstream of this function needs to change.
 */
export function getPaymentProvider(): PaymentProvider {
  if (!cached) cached = new SafepayPaymentProvider();
  return cached;
}
