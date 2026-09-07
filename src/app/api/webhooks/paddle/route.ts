import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getPaymentProviderByName } from "@/services/payment";
import { fulfilOrder } from "@/services/orders";

/**
 * Paddle webhook.
 *
 * Order of operations matters and is deliberate:
 *
 *   1. Read the RAW body. Signature is computed over the exact bytes sent —
 *      re-serialising JSON changes key order and whitespace and breaks it.
 *   2. Verify the signature BEFORE trusting any field in the payload.
 *   3. Record the event, then act. The unique index on
 *      (provider, provider_event_id) is what makes this idempotent: a retried
 *      delivery fails to insert and we acknowledge without re-granting access.
 *   4. Always return 2xx once handled, including for duplicates. A non-2xx
 *      makes Paddle retry, which turns a handled event into a retry storm.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const provider = getPaymentProviderByName("paddle");

  let event;
  try {
    event = await provider.verifyWebhook({ rawBody, headers });
  } catch (error) {
    console.error("[webhook:paddle] verification threw", error);
    return NextResponse.json({ error: "verification_failed" }, { status: 400 });
  }

  if (!event.signatureValid) {
    // Do not record unverified payloads as events - an attacker could
    // otherwise fill the table with junk using a guessed event id.
    console.warn("[webhook:paddle] rejected: invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { error: insertError } = await supabase.from("webhook_events").insert({
    provider: "paddle",
    provider_event_id: event.eventId,
    event_type: event.eventType,
    payload: event.payload as object,
    signature_valid: true,
  });

  if (insertError) {
    // 23505 = unique_violation: we have seen this event before.
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[webhook:paddle] could not record event", insertError);
    return NextResponse.json({ error: "record_failed" }, { status: 500 });
  }

  const payment = event.payment;
  const isCompletion =
    event.eventType === "transaction.completed" ||
    event.eventType === "transaction.paid";

  if (isCompletion && payment?.orderId && payment.status === "SUCCEEDED") {
    const result = await fulfilOrder({
      orderId: payment.orderId,
      providerReference: payment.providerReference,
      provider: "paddle",
      paidAmount: payment.paid.amount,
      paidCurrency: payment.paid.currency,
    });

    await supabase
      .from("webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        processing_error: result.fulfilled ? null : (result.reason ?? null),
      })
      .eq("provider", "paddle")
      .eq("provider_event_id", event.eventId);

    return NextResponse.json({ ok: true, fulfilled: result.fulfilled });
  }

  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "paddle")
    .eq("provider_event_id", event.eventId);

  return NextResponse.json({ ok: true, handled: false });
}
