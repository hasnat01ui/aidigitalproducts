import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { OrderError, createOrder } from "@/services/orders";
import { absoluteUrl } from "@/lib/site";
import {
  PaymentProviderError,
  getPaymentProviderByName,
  isCheckoutAvailable,
} from "@/services/payment";

/**
 * Start a checkout.
 *
 * The request body carries a product SLUG and an optional coupon CODE — never
 * a price, never an amount, never a currency the caller picked for value
 * reasons. Everything financial is resolved server-side in `createOrder`.
 *
 * A client that could name its own price is the single most common and most
 * expensive vulnerability in an e-commerce build, and this boundary is where
 * it is prevented.
 */

const schema = z.object({
  productSlug: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  couponCode: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    z.string().trim().max(60).optional(),
  ),
  // Market selection only. It chooses which PRICE ROW and which gateway
  // applies — it can never change the amount stored against that row.
  currency: z.enum(["USD", "PKR"]).default("USD"),
});

export async function POST(request: Request) {
  if (!isCheckoutAvailable()) {
    return NextResponse.json(
      {
        error:
          "Checkout is not available yet. No payment gateway is configured.",
      },
      { status: 503 },
    );
  }

  const limit = rateLimit(`checkout:${clientIp(request)}`, {
    max: 10,
    windowMs: 60_000,
  });
  if (limit.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "We couldn't start that checkout. Please try again." },
      { status: 400 },
    );
  }

  const { productSlug, email, couponCode, currency } = parsed.data;

  // Attach the order to a signed-in user when there is one, so entitlement can
  // be granted on fulfilment. Guests can still buy; access attaches when they
  // register with the same address.
  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  try {
    const order = await createOrder(
      { productSlug, email, userId, couponCode },
      currency,
    );

    const provider = getPaymentProviderByName(order.provider);

    const checkout = await provider.createCheckout({
      orderId: order.orderId,
      orderReference: order.orderReference,
      total: { amount: order.totalAmount, currency: order.currency },
      customer: { email },
      successUrl: absoluteUrl(`/payment/success?ref=${order.orderReference}`),
      cancelUrl: absoluteUrl("/payment/cancelled"),
    });

    const supabase = createSupabaseAdminClient();

    await supabase.from("payments").insert({
      order_id: order.orderId,
      provider: order.provider,
      provider_reference: checkout.providerReference,
      status: "INITIATED",
      currency: order.currency,
      amount: order.totalAmount,
    });

    await supabase
      .from("orders")
      .update({ status: "PAYMENT_INITIATED" })
      .eq("id", order.orderId);

    await supabase.from("analytics_events").insert({
      event_name: "checkout_started",
      order_id: order.orderId,
      metadata: { provider: order.provider, currency: order.currency },
    });

    return NextResponse.json({
      ok: true,
      redirectUrl: checkout.redirectUrl,
      orderReference: order.orderReference,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      const status = error.code === "coupon_invalid" ? 400 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }

    if (error instanceof PaymentProviderError) {
      console.error("[checkout] provider error", error);
      return NextResponse.json(
        { error: "Our payment provider is unavailable. Please try again." },
        { status: 502 },
      );
    }

    console.error("[checkout] unexpected error", error);
    return NextResponse.json(
      { error: "Something went wrong starting your checkout." },
      { status: 500 },
    );
  }
}
