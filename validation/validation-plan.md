# AUREVIA — Validation Plan

**Date:** 2026-09-07
**Purpose:** Test whether the recommended niche and product are real *before* spending weeks building them.
**Governing rule:** if validation fails, AUREVIA pivots. This plan is only worth writing if its failure criteria are genuinely allowed to stop the build.

---

## 0. Why this comes before the build

Everything in `research/` is a hypothesis derived from desk research. AUREVIA has zero customers, zero traffic, and zero revenue. The single most expensive mistake available right now is to spend three weeks building the flagship system for a problem agency owners do not agree they have.

The whole plan is designed to be executable **without a finished product, without a merchant account, and without ad spend** — because none of those exist yet.

---

## 1. What is being tested

| # | Assumption | Consequence if false | Priority |
|---|---|---|---|
| A1 | Agency owners identify non-billable work as a top-3 bottleneck | Entire product aimed at the wrong problem — full pivot | **Critical** |
| A2 | They will pay $199–$499 for a system (not a subscription, not a template) | Repackage as membership or reprice | **Critical** |
| A3 | "System" is perceived as materially different from "prompt pack" | Priced 10× above a category AUREVIA cannot escape | **Critical** |
| A4 | They will buy from an unknown brand with no case studies | Need founding-customer motion, longer runway | High |
| A5 | Team adoption is achievable, not just owner adoption | Value proposition collapses; refunds | High |
| A6 | This audience is reachable organically via LinkedIn/YouTube/communities | Requires paid acquisition AUREVIA has not budgeted | High |
| A7 | Safepay checkout does not destroy conversion for non-Pakistani buyers | Geography or gateway strategy must change | **Critical** |

A7 is a business-model assumption the brief does not raise but the payment research makes unavoidable. See `docs/safepay-integration.md` §5.

---

## 2. Method — five stages, cheapest first

### Stage 1 — Community & language research (Days 1–3, £0)

**Do:** read, do not post. r/agency, r/marketing, r/consulting, r/Entrepreneur, agency Slack/Circle communities, LinkedIn posts from agency owners.

**Collect:** 100+ verbatim quotes about operational pain, in the buyer's own words. Tag each as billable-capacity, lead-gen, hiring, admin, client management, or other.

**Passes A1 if:** non-billable / admin / capacity themes appear in **≥25%** of operational-pain posts, and appear unprompted.

**Fails if:** lead generation and cash flow dominate and admin barely registers — which would mean the agency's felt bottleneck is *getting* work, not *delivering* it. That points to product idea #2 or niche #8 instead.

*Note: this stage also produces the raw material for all sales copy. Even if it invalidates the thesis, the time is not wasted.*

### Stage 2 — Customer interviews (Days 3–8, £0)

**Do:** 10–15 conversations of 20–30 minutes with agency owners and independent consultants. Recruit via LinkedIn outreach, communities, and existing network. Offer the time-recovery audit free in exchange.

**Rules:** ask about their past and present, never about a hypothetical product. Never pitch. Never ask "would you buy this?" — the answer is meaningless.

**Ask:**
- Walk me through last week. Where did the hours actually go?
- What percentage of your team's time is non-billable? How do you know?
- What did you do the last time you were at capacity?
- What have you already tried with AI? What happened to it?
- What have you paid for in the last year to solve this? What did it cost?
- Who else on the team uses AI? How consistently?

**Passes A1 if:** ≥7 of 10 independently raise non-billable work, capacity, or delivery inconsistency without prompting.
**Passes A2 if:** ≥5 of 10 report having already spent $150+ on tools, templates, or consulting for operational problems.
**Passes A5 if:** ≥5 of 10 describe inconsistent AI use across their team as a real problem.

**Fails if:** fewer than 4 of 10 raise the problem unprompted. That is a pivot signal, not a marketing problem.

### Stage 3 — Lead magnet + landing page test (Days 8–14, cost: domain only)

**Do:** ship the Agency Time-Recovery Audit (product idea #9) behind an email capture on a single AUREVIA landing page. Distribute through the communities and contacts from Stages 1–2. No paid traffic.

**Measure:** visitors, email conversion rate, audit completions, and — most importantly — **replies**.

**Passes A6 if:** ≥100 visitors from organic effort alone within 14 days.
**Passes A1/A3 if:** email opt-in rate is **≥25%** (a lead magnet solving a real, named pain should clear this comfortably; a generic one will not).
**Strong signal if:** ≥5 people reply asking what else AUREVIA offers, unprompted.

**Fails if:** opt-in rate is under 10%, or organic distribution cannot produce 100 visitors. The first says the problem framing is wrong; the second says the channel assumption is wrong.

### Stage 4 — Pre-sale of the starter product (Days 14–21)

The only test that produces real evidence. Everything before this is people being polite.

**Do:** offer the AI Proposal Engine (idea #2) to the email list at a founding price (~$49, rising to $79 at launch), with an explicit and honest promise: *this is being built now, delivery in 14 days, full refund on request, no questions.* Founding customers get input on the build.

**This is not fake scarcity.** The product genuinely does not exist yet, the price genuinely rises, and the deadline is genuinely real. That distinction matters and must hold — it is the difference between a legitimate pre-sale and the manufactured urgency the brand forbids.

**Passes A2 + A4 if:** **≥10 pre-sales** from a list of 100+.
**Weak pass:** 5–9 pre-sales — real interest, but pricing or positioning needs work before the flagship.
**Fails if:** fewer than 5. Interest without purchase means the pain is not expensive enough to solve.

**Passes A7 if:** checkout completion rate is ≥60% of initiated checkouts, and non-Pakistani buyers complete at a rate not dramatically below Pakistani buyers.

> **Prerequisite and likely blocker:** Stage 4 requires an approved Safepay merchant account. If that is not ready, run the stage as a **waitlist with explicit purchase intent** (name, company, "I will buy at $49" confirmation) and convert to payment when the gateway is live. This is a weaker signal and must be labelled as such — a stated intent is not a sale, and should never be counted as one.

### Stage 5 — Deliver, then measure outcomes (Days 21–35)

**Do:** build and ship the starter product to founding customers. Follow up at 14 days.

**Measure:** activation (did they use it?), outcome (hours saved, measured against their audit baseline), refund rate, and willingness to give a testimonial.

**Passes A5 if:** ≥60% used it at least twice.
**Passes overall if:** refund rate ≤15%, and ≥3 customers volunteer a genuine testimonial.

**This stage produces AUREVIA's first real social proof.** Per the brief's absolute rules, testimonials are only ever used once earned here — never before, never invented.

---

## 3. Decision gates

| Gate | When | Proceed if | Otherwise |
|---|---|---|---|
| **G1 — Problem** | End of Stage 2 | ≥7/10 interviews confirm A1 | Pivot to niche #8 or #14. Do not build. |
| **G2 — Message** | End of Stage 3 | ≥25% opt-in, ≥100 organic visitors | Rewrite positioning, re-test once. Two failures = pivot. |
| **G3 — Money** | End of Stage 4 | ≥10 pre-sales | 5–9: reprice and re-test. <5: pivot. |
| **G4 — Delivery** | End of Stage 5 | ≤15% refunds, ≥60% activation | Fix the product before building the flagship |
| **G5 — Build flagship** | After G4 | All gates passed | Do **not** build the $299 core product until G4 passes |

**The hard rule:** the flagship Non-Billable Recovery System is not built until G4 passes. That is the single most important line in this document, and it is the one most likely to be ignored under enthusiasm.

---

## 4. What runs in parallel

Work that is useful regardless of the validation outcome, and can proceed now without prejudging the result:

- ✅ Repository and Supabase inspection (done)
- Brand foundation — AUREVIA name, palette, typography, voice (niche-independent)
- Technical foundation — Next.js scaffold, Supabase auth, base schema
- Safepay merchant account application — **start immediately; this has the longest external lead time and is the top schedule risk**
- Safepay sandbox integration
- Legal pages

Work that must **not** start until G1 passes: product content, sales copy, pricing page, positioning, SEO and content strategy. All of these are niche-dependent and would be wasted by a pivot.

---

## 5. Honest assessment of this plan

**Strengths:** cheap, fast, sequenced so the cheapest tests kill bad ideas first, and it produces marketing assets even on failure.

**Weaknesses to acknowledge rather than paper over:**

- 10–15 interviews is a small sample. It catches a badly wrong thesis; it will not catch a subtly wrong one.
- Recruiting interviewees from the founder's network biases toward people inclined to be encouraging.
- The Safepay dependency may force Stage 4 into a weaker waitlist form, degrading the single most important signal in the plan.
- A pre-sale tests willingness to buy a *promise*, which is not identical to willingness to buy a *product*.

None of these invalidate the plan. They mean the results should be read as directional evidence, not proof — and that Stage 5's delivery data is what ultimately confirms the thesis.
