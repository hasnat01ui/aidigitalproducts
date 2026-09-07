import type { CurrencyCode, MinorUnits } from "@/services/payment/types";

/**
 * Money handling.
 *
 * Every monetary value in AUREVIA is an integer number of minor units.
 * Floating point is never used for money: 0.1 + 0.2 !== 0.3 in binary floating
 * point, and that class of error compounds silently into real discrepancies
 * between what a customer was charged and what was recorded.
 */

/** Currencies whose "minor unit" is the same as the major unit. */
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP", "ISK"]);

export function minorUnitExponent(currency: CurrencyCode): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

/** 299.5 USD -> 29950. Rejects values that cannot be represented exactly. */
export function toMinorUnits(
  major: number,
  currency: CurrencyCode,
): MinorUnits {
  const factor = 10 ** minorUnitExponent(currency);
  const scaled = Math.round(major * factor);

  if (Math.abs(major * factor - scaled) > 1e-6) {
    throw new Error(
      `Amount ${major} has more precision than ${currency} supports.`,
    );
  }
  return scaled;
}

export function formatMoney(
  amount: MinorUnits,
  currency: CurrencyCode,
  locale = "en-US",
): string {
  const exponent = minorUnitExponent(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(amount / 10 ** exponent);
}

export function assertSameCurrency(a: CurrencyCode, b: CurrencyCode): void {
  if (a.toUpperCase() !== b.toUpperCase()) {
    throw new Error(`Currency mismatch: ${a} vs ${b}`);
  }
}

/**
 * Percentage discount, rounded half-up, clamped so it can never exceed the
 * base amount (which would otherwise produce a negative total).
 */
export function applyPercentDiscount(
  amount: MinorUnits,
  percentOff: number,
): MinorUnits {
  if (percentOff < 0 || percentOff > 100) {
    throw new Error(`Invalid discount percentage: ${percentOff}`);
  }
  return Math.min(amount, Math.round((amount * percentOff) / 100));
}

/**
 * A short, human-facing order reference. Unambiguous alphabet — no I, O, 0, 1 —
 * so a customer reading it aloud to support cannot get it wrong.
 */
export function generateOrderReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `AUR-${out}`;
}
