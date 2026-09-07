import "server-only";

import { isPaymentsEnabled, serverEnv } from "@/lib/env";
import { PaddlePaymentProvider } from "@/services/payment/paddle/provider";
import { SafepayPaymentProvider } from "@/services/payment/safepay/provider";
import type { CurrencyCode, PaymentProvider } from "@/services/payment/types";

export * from "@/services/payment/types";

/**
 * Provider selection.
 *
 * AUREVIA runs two gateways on purpose, and the split is by market, not by
 * preference:
 *
 *   Safepay  — PRIMARY. Pakistani customers paying in PKR. Local rails, local
 *              trust, lowest fees (2.9% + Rs 30 domestic).
 *
 *   Paddle   — INTERNATIONAL. Everyone else. Chosen because it is a Merchant
 *              of Record: it becomes the legal seller and handles EU VAT, UK
 *              VAT, US sales tax and GST across 30+ jurisdictions. A small
 *              Pakistani company cannot register and file in all of those,
 *              and that liability — not card processing — is the reason a
 *              second provider exists at all. Costs ~5% + $0.50.
 *
 * Business logic never names a provider. It calls `getPaymentProvider()` with
 * the order's currency, and routing lives here alone.
 */

export type PaymentProviderName = "safepay" | "paddle";

let safepay: SafepayPaymentProvider | null = null;
let paddle: PaddlePaymentProvider | null = null;

function safepayProvider(): PaymentProvider {
  if (!safepay) safepay = new SafepayPaymentProvider();
  return safepay;
}

function paddleProvider(): PaymentProvider {
  if (!paddle) paddle = new PaddlePaymentProvider();
  return paddle;
}

export function providerNameForCurrency(
  currency: CurrencyCode,
): PaymentProviderName {
  return currency.toUpperCase() === "PKR" ? "safepay" : "paddle";
}

export function getPaymentProviderByName(
  name: PaymentProviderName,
): PaymentProvider {
  return name === "safepay" ? safepayProvider() : paddleProvider();
}

/**
 * The entry point business logic uses.
 *
 * Routing is by currency because currency is what actually determines the
 * rails and the tax treatment — not the customer's IP, which is spoofable and
 * frequently wrong for VPN users and travellers.
 */
export function getPaymentProvider(
  currency: CurrencyCode = "USD",
): PaymentProvider {
  return getPaymentProviderByName(providerNameForCurrency(currency));
}

/** Currencies AUREVIA can actually charge in today. */
export function supportedCurrencies(): CurrencyCode[] {
  const currencies: CurrencyCode[] = [];
  if (isPaddleConfigured()) currencies.push("USD");
  if (isPaymentsEnabled()) currencies.push("PKR");
  return currencies;
}

export function isPaddleConfigured(): boolean {
  try {
    return Boolean(serverEnv().PADDLE_API_KEY);
  } catch {
    return false;
  }
}

/** True when at least one gateway can actually take money. */
export function isCheckoutAvailable(): boolean {
  return isPaddleConfigured() || isPaymentsEnabled();
}
