import "server-only";

import { generateOrderReference } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { providerNameForCurrency } from "@/services/payment";

/**
 * Order creation and fulfilment.
 *
 * The single rule this module exists to enforce: **the browser never decides
 * what anything costs, and never decides whether it was paid for.**
 *
 * Prices are read from the database. Totals are computed here. Access is
 * granted only from a signature-verified webhook that agrees on amount and
 * currency. The database backs this up with a CHECK constraint on the total
 * and a unique index that makes webhook replay a no-op.
 */

export interface CreateOrderInput {
  productSlug: string;
  email: string;
  userId?: string | null;
  couponCode?: string | null;
}

export interface CreateOrderResult {
  orderId: string;
  orderReference: string;
  currency: string;
  totalAmount: number;
  productName: string;
  provider: "safepay" | "paddle";
}

export class OrderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "product_not_found"
      | "price_not_found"
      | "coupon_invalid"
      | "persist_failed",
  ) {
    super(message);
    this.name = "OrderError";
  }
}

/**
 * Creates a PENDING order with a server-calculated total.
 *
 * `currency` is chosen by the caller's market, and the price for that currency
 * must exist in `product_prices` — we never convert on the fly, because a
 * stale exchange rate becomes a real mispriced sale.
 */
export async function createOrder(
  input: CreateOrderInput,
  currency = "USD",
): Promise<CreateOrderResult> {
  const supabase = createSupabaseAdminClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, status")
    .eq("slug", input.productSlug)
    .eq("status", "published")
    .maybeSingle();

  if (productError || !product) {
    throw new OrderError(
      `No published product with slug "${input.productSlug}"`,
      "product_not_found",
    );
  }

  const { data: price, error: priceError } = await supabase
    .from("product_prices")
    .select("unit_amount, currency")
    .eq("product_id", product.id)
    .eq("currency", currency.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (priceError || !price) {
    throw new OrderError(
      `No active ${currency} price for "${input.productSlug}"`,
      "price_not_found",
    );
  }

  const subtotal = Number(price.unit_amount);
  let discount = 0;
  let couponId: string | null = null;

  if (input.couponCode) {
    // Coupons are validated server-side only. The coupons table has no public
    // read policy precisely so codes cannot be enumerated from the browser.
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, percent_off, amount_off, currency, is_active, starts_at, expires_at, max_redemptions, times_redeemed")
      .eq("code", input.couponCode.trim().toUpperCase())
      .maybeSingle();

    const now = Date.now();
    const usable =
      coupon &&
      coupon.is_active &&
      (!coupon.starts_at || new Date(coupon.starts_at).getTime() <= now) &&
      (!coupon.expires_at || new Date(coupon.expires_at).getTime() > now) &&
      (coupon.max_redemptions === null ||
        coupon.times_redeemed < coupon.max_redemptions);

    if (!usable) {
      throw new OrderError("That code is not valid.", "coupon_invalid");
    }

    couponId = coupon.id;

    if (coupon.percent_off) {
      discount = Math.min(
        subtotal,
        Math.round((subtotal * coupon.percent_off) / 100),
      );
    } else if (coupon.amount_off && coupon.currency === price.currency) {
      discount = Math.min(subtotal, Number(coupon.amount_off));
    }
  }

  // Tax is zero for Paddle-routed orders because Paddle is the Merchant of
  // Record and calculates/collects tax itself at checkout. Adding tax here
  // too would double-charge the customer.
  const tax = 0;
  const total = subtotal - discount + tax;

  const reference = generateOrderReference();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      reference,
      user_id: input.userId ?? null,
      email: input.email.toLowerCase(),
      status: "PENDING",
      currency: price.currency,
      subtotal_amount: subtotal,
      discount_amount: discount,
      tax_amount: tax,
      total_amount: total,
      coupon_id: couponId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new OrderError(
      `Could not create order: ${orderError?.message}`,
      "persist_failed",
    );
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    // Snapshot: historical orders stay accurate after a rename or reprice.
    product_name: product.name,
    unit_amount: subtotal,
    quantity: 1,
    line_total_amount: subtotal,
  });

  if (itemError) {
    throw new OrderError(
      `Could not create order item: ${itemError.message}`,
      "persist_failed",
    );
  }

  return {
    orderId: order.id,
    orderReference: reference,
    currency: price.currency,
    totalAmount: total,
    productName: product.name,
    provider: providerNameForCurrency(price.currency),
  };
}

/**
 * Marks an order paid and grants product access.
 *
 * Called ONLY from a webhook handler that has already verified the provider's
 * signature. Idempotent: re-running it for an already-paid order is a no-op,
 * because a provider that retries a delivery must not grant access twice or
 * double-count revenue.
 */
export async function fulfilOrder(params: {
  orderId: string;
  providerReference: string;
  provider: string;
  paidAmount: number;
  paidCurrency: string;
}): Promise<{ fulfilled: boolean; reason?: string }> {
  const supabase = createSupabaseAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, email, user_id, currency, total_amount")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!order) return { fulfilled: false, reason: "order_not_found" };

  // Already fulfilled — a duplicate delivery. Acknowledge, change nothing.
  if (order.status === "PAID") return { fulfilled: false, reason: "already_paid" };

  // The provider must agree with us about what was charged. A mismatch means
  // either tampering or a bug; either way it must not silently grant access.
  if (
    Number(order.total_amount) !== params.paidAmount ||
    order.currency.toUpperCase() !== params.paidCurrency.toUpperCase()
  ) {
    await supabase
      .from("orders")
      .update({ status: "FAILED" })
      .eq("id", order.id);

    console.error(
      `[orders] amount/currency mismatch on ${order.id}: ` +
        `expected ${order.total_amount} ${order.currency}, ` +
        `provider reported ${params.paidAmount} ${params.paidCurrency}`,
    );

    return { fulfilled: false, reason: "amount_mismatch" };
  }

  await supabase.from("payments").upsert(
    {
      order_id: order.id,
      provider: params.provider,
      provider_reference: params.providerReference,
      status: "SUCCEEDED",
      currency: params.paidCurrency.toUpperCase(),
      amount: params.paidAmount,
    },
    { onConflict: "provider,provider_reference" },
  );

  await supabase.from("orders").update({ status: "PAID" }).eq("id", order.id);

  // Grant access to every purchased product. Only possible for a registered
  // user — a guest checkout has nothing to attach entitlement to, so the
  // order stays PAID and access is granted when they create an account with
  // the same email.
  if (order.user_id) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("order_id", order.id);

    for (const item of items ?? []) {
      await supabase.from("product_access").upsert(
        {
          user_id: order.user_id,
          product_id: item.product_id,
          order_id: order.id,
          status: "active",
        },
        { onConflict: "user_id,product_id,order_id" },
      );
    }
  }

  await supabase.from("analytics_events").insert({
    event_name: "purchase_completed",
    order_id: order.id,
    metadata: {
      provider: params.provider,
      amount: params.paidAmount,
      currency: params.paidCurrency,
    },
  });

  return { fulfilled: true };
}
