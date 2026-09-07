# AUREVIA — SEO Strategy

**Date:** 2026-09-07
**Target:** Small agency owners and independent consultants (see `research/customer-avatar.md`)

---

## 0. The honest position

AUREVIA is a brand-new domain with zero authority, zero backlinks, and zero content. **SEO will not produce meaningful traffic for 4–8 months.** Anyone promising faster is selling something.

This matters strategically: SEO is the *compounding* channel, not the *launch* channel. Validation Stages 1–3 must be driven by direct outreach, communities, and LinkedIn — not by waiting for Google. SEO work done now pays off in Q2, and that is the correct expectation to hold.

Volume figures below are **unverified estimates**. No keyword tool has been run. Verify in Search Console and a keyword tool before committing to any cluster.

---

## 1. Technical foundation — implemented

| Item | Status | Where |
|---|---|---|
| Per-page metadata (title, description) | ✅ | Each `page.tsx` |
| Title template (`%s — AUREVIA`) | ✅ | `src/app/layout.tsx` |
| Canonical URLs | ✅ | `alternates.canonical` per page |
| Open Graph + Twitter cards | ✅ | `src/app/layout.tsx` |
| `sitemap.xml` | ✅ | `src/app/sitemap.ts` |
| `robots.txt` | ✅ | `src/app/robots.ts` |
| **Preview deploys blocked from indexing** | ✅ | `isIndexable` in `src/lib/site.ts` |
| Organization + WebSite JSON-LD | ✅ | `src/components/StructuredData.tsx` |
| FAQPage JSON-LD | ✅ | Homepage, mirrors visible FAQ |
| Security headers (HSTS etc.) | ✅ | `next.config.ts` |
| Semantic HTML + heading hierarchy | ✅ | One `h1` per page |
| Mobile responsive | ✅ | Tailwind, mobile-first |
| Static rendering | ✅ | All content pages prerendered |
| Internal linking | ✅ | Shared footer via `PageShell` |
| Image optimisation | ⏳ | No images yet; use `next/image` when added |
| Blog + article schema | ⏳ | When the blog ships |
| Product schema | ⏳ | **Only when a real product with a real price exists** |

**Deliberately not implemented:** `aggregateRating`, `review`, and `Offer` schema. Google penalises structured data that contradicts the page, and inventing ratings would breach the brand's no-fake-proof rule. These get added when they are true.

---

## 2. Keyword strategy

AUREVIA cannot win "AI tools" or "AI for business" — those belong to funded incumbents. The strategy is **long-tail, high-intent, low-volume**: terms where the searcher has our exact problem and almost nobody has written for them properly.

Ranking #1 for a 90/month query with buying intent beats page 4 for a 40,000/month query.

### Intent tiers

| Tier | Intent | Example | Converts? | Priority |
|---|---|---|---|---|
| 1 | Problem-aware | "reduce non-billable hours agency" | High | **Highest** |
| 2 | Solution-aware | "AI workflow for agency proposals" | High | **Highest** |
| 3 | Comparison | "notion ai vs custom prompts for agencies" | Medium | Medium |
| 4 | Informational | "what is an agency SOP" | Low | Low |
| 5 | Branded | "aurevia" | n/a | Nil (nobody knows us) |

Tiers 1 and 2 get ~80% of effort. Tier 4 exists to build topical authority, not to convert.

---

## 3. Content clusters

Four clusters, each a pillar page plus supporting articles, interlinked. This structure signals topical depth to Google and is how a small site outranks bigger ones in a narrow niche.

### Cluster 1 — Non-billable time *(the beachhead — build first)*

**Pillar:** "The Real Cost of Non-Billable Work in a Small Agency"

Supporting: how to measure non-billable time · agency utilisation rate explained · why agencies stall at capacity · reducing admin without hiring · agency time tracking that people actually use

*Maps to:* the Time-Recovery Audit lead magnet. Highest commercial relevance.

### Cluster 2 — AI for agency delivery

**Pillar:** "How Small Agencies Actually Use AI (Without It Becoming a Mess)"

Supporting: AI proposal workflow · AI client onboarding · AI client reporting · getting consistent AI output across a team · why prompt packs fail · model-agnostic AI workflows

*Maps to:* the AI Proposal Engine and the core system.

### Cluster 3 — Agency operations

**Pillar:** "The Agency Operating System: Systems That Survive Growth"

Supporting: agency SOPs that get used · client onboarding checklist · scope creep prevention · retainer renewal process · delegating without losing quality

### Cluster 4 — Pricing & profitability

**Pillar:** "Why Agencies Stay Busy and Broke"

Supporting: agency pricing models · calculating true project cost · effective hourly rate · when to raise retainer prices

---

## 4. On-page rules

1. **One primary keyword per page.** Two pages targeting the same term cannibalise each other.
2. **Title:** primary keyword near the front, under 60 characters, written for a human.
3. **Description:** under 155 characters. It does not affect ranking; it affects click-through, which does.
4. **One `h1`.** Subheadings carry semantic variants, not repetitions.
5. **Answer the query in the first 100 words.** Then earn the rest of the read.
6. **Internal links:** every article links to its pillar; every pillar links to its children.
7. **Write for the buyer's vocabulary** — "retainer", "utilisation", "scope creep", "non-billable" — harvested from validation Stage 1 community research, not invented.
8. **No AI-generated filler.** Thin content is actively penalised, and this audience detects it immediately.

---

## 5. Off-page

Backlinks matter, and AUREVIA has none. Realistic, non-spammy sources for a new brand:

- **Original data.** Publish anonymised, aggregated findings from the Time-Recovery Audit. Genuinely new numbers about agency non-billable time are the single most linkable asset available — nobody else has this data.
- **Guest posts** on agency and freelance publications.
- **Podcast appearances** — agency-owner podcasts are numerous and always need guests.
- **Free tools.** A public calculator earns links passively for years.
- **Community participation** — Reddit, Indie Hackers, agency Slacks. Contribute genuinely; links follow.

**Never:** buy links, use PBNs, mass-guest-post, or run directory spam. A manual penalty on a new domain is close to fatal.

---

## 6. Measurement

Track in Google Search Console: impressions, average position, CTR, indexed pages.
Track in `analytics_events`: `page_view` → `lead_created` conversion by landing page.

**The metric that matters is `lead_created` from organic — not sessions.** Traffic that does not convert is a vanity number.

### Realistic milestones

| When | Expectation |
|---|---|
| Month 1 | Indexed. Near-zero traffic. **This is normal.** |
| Month 2–3 | First long-tail impressions; positions 30–80 |
| Month 4–6 | First page-1 rankings on low-competition long-tail |
| Month 6–12 | Compounding; organic becomes a real lead source |

---

## 7. Priority order

1. ✅ Technical foundation (done)
2. Ship the Time-Recovery Audit — it is both the lead magnet and the source of linkable original data
3. Publish Cluster 1 pillar + 3 supporting articles
4. Google Search Console + Bing Webmaster verification, submit sitemap
5. Cluster 2
6. Free calculator tool
7. Guest posts and podcasts
8. Clusters 3 and 4

See `marketing/blog-topics.md` for the 30 planned articles.
