# AUREVIA — Safepay Integration Research

**Research date:** 2026-09-07
**Status:** Research only. No code written yet. Endpoints to be confirmed against official docs at implementation time.

---

## 1. Why this document exists

Safepay is mandated as AUREVIA's primary payment gateway. Because payments determine what the business can charge, who it can charge, and where the money lands, this research was done **before** niche selection rather than after — the gateway is a business constraint, not just a technical one.

## 2. Sources consulted

| Source | What it covers |
|---|---|
| `https://safepay-docs.netlify.app/` | Main merchant developer docs — checkout, trackers, webhooks, test cards |
| `https://safepay.mintlify.app` / `.site/llms.txt` | **Raast aggregator** docs — a different product (real-time payments, QR, payouts), not standard merchant checkout |
| `https://apidocs.getsafepay.com/` | Postman API explorer — authoritative endpoint reference |
| `https://safepay.helpscoutdocs.com/article/131-safepay-fee-breakdown` | Published fee schedule |
| Official SDK repos: `getsafepay/sfpy-php`, `getsafepay/safepay-dotnet`, `@sfpy/node-core` (npm) | Reference implementations |

> **Important correction to the brief.** The brief lists `https://safepay.mintlify.app` as a primary technical source. That site documents Safepay's **Raast aggregator** product — request-to-pay, dynamic/static QR, bank payouts, settlement batches. It is *not* the standard merchant hosted-checkout product AUREVIA needs. The correct primary source is `safepay-docs.netlify.app` plus the Postman API reference. Building against the Raast docs would be building the wrong integration.

## 3. Integration model

Safepay's merchant flow is built around a **Tracker**:

1. Server calls Safepay to create a tracker (the "setup payment" step) with amount, currency, and intent.
2. Safepay returns a tracker token, e.g. `track_e772f8b3-edc7-4a6f-9e85-94d262c03087`.
3. The token is used to construct a **hosted checkout URL**, and the customer is redirected there.
4. Customer pays on Safepay's hosted page. AUREVIA never touches card data — this keeps PCI scope minimal and satisfies the "never store card details" rule structurally rather than by discipline.
5. Safepay redirects back and fires a webhook.
6. Server verifies the webhook signature, confirms the payment, and only then marks the order paid and grants product access.

A tracker object carries `token`, `state` (e.g. `TRACKER_ENDED`), `purchase_totals` (currency + amount), `customer`, `client`, and `next_actions`.

Two integration tiers exist:

- **Hosted Checkout** — redirect to Safepay's page. Lowest effort, lowest PCI burden. **This is what AUREVIA will use initially**, matching the brief.
- **Advanced Checkout** — embedded/custom UI, requiring a temporary client token from `/client/passport/v1/token`. Deferred; no reason to take on the extra surface area for an MVP.

Environments:

| Environment | Dashboard |
|---|---|
| Sandbox | `sandbox.api.getsafepay.com/dashboard/login` |
| Production | `getsafepay.com/dashboard/login` |

Exact API base URLs and request/response schemas will be read from the Postman reference at implementation time rather than guessed or copied from tutorials.

## 4. Published fees

| Transaction type | Fee |
|---|---|
| Domestic (PKR) | 2.9% + Rs 30 (exclusive of tax) |
| International | 3.2% + Rs 30 (exclusive of tax) |

These feed directly into `business/pricing.md` and `business/ai-unit-economics.md`. The flat Rs 30 component matters: it is a large proportion of a low-ticket sale and effectively rules out very cheap products (a Rs 300 product loses ~19% to fees; a Rs 5,000 product loses ~3.5%). **This argues for fewer, higher-value products rather than a catalogue of cheap ones.**

## 5. The material business constraint

**Safepay is a Pakistani gateway that settles in PKR.** It accepts international cards at the higher rate, but it is optimised for domestic processing, and funds land in a Pakistani merchant account. Common practice among Pakistani businesses selling globally is to run Safepay for domestic PKR sales alongside a separate provider for international collection.

Three consequences AUREVIA must design around:

1. **Pricing currency.** If AUREVIA sells to a global audience, prices are most credibly displayed in USD but the settlement and likely the charge currency is PKR. Displayed-vs-charged currency mismatch is a real checkout drop-off cause and must be handled honestly in the UI, not hidden.
2. **Buyer trust.** A US or EU buyer redirected from a premium-looking brand to an unfamiliar Pakistani gateway is a conversion risk. Not fatal, but it is a measurable cost that a global-audience strategy has to absorb.
3. **Merchant account prerequisite.** Safepay requires a registered Pakistani business entity and KYC. **Nothing can be charged until that account exists and is approved.** This is a hard, real-world, non-engineering blocker and is the single largest schedule risk in the project.

This does not change the mandate — Safepay stays primary, as instructed. It changes the *architecture*: the `PaymentProvider` abstraction required by the brief (§33) is not future-proofing for its own sake, it is the mechanism that lets AUREVIA add an international provider later without touching business logic. That abstraction is therefore treated as mandatory in v1, not optional.

## 6. Capabilities still to be confirmed

Marked open because they were not confirmed from official documentation, and guessing would be worse than an open question:

- [ ] Exact hosted-checkout URL construction and required query parameters
- [ ] Webhook signature verification algorithm and header names
- [ ] Whether native **recurring/subscription** billing is supported for merchant checkout — this gates Aurevia Pro. If it is not supported, Pro must be modelled as a manually renewed term rather than a true subscription.
- [ ] Full list of currencies accepted at charge time
- [ ] Refund API scope: full vs partial, and time limits
- [ ] Sandbox test card numbers

Each of these will be resolved from the official Postman reference and docs during implementation (Step 16), and this document updated with confirmed values.

## 7. Non-negotiable security rules for this integration

1. Payment success is **never** inferred from the browser. Opening `/payment/success` grants nothing.
2. The final amount is **always** computed server-side from the product price, discount, and applicable tax. The frontend never supplies or influences the charged amount.
3. The webhook handler verifies authenticity before trusting any payload.
4. Webhook processing is **idempotent** — a replayed or duplicated event must not grant access twice or double-count revenue. Enforced by a unique constraint on the provider event ID in `webhook_events`.
5. Before access is granted, the server independently confirms amount and currency match the order. A mismatch fails the order and raises an alert rather than silently passing.
6. Product access is created only after verified payment, never before.
7. Sandbox credentials only, until launch. Production keys are never present in a development environment.

## 8. Related documents

- `docs/safepay-testing.md` — sandbox test plan (to be written before implementation)
- `business/pricing.md` — pricing built on the fee structure above
