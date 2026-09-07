# AUREVIA — Deployment & Google Setup

**Date:** 2026-09-07
**Status:** Codebase is deployment-ready. Deployment itself requires your accounts.

---

## 0. Read this first

**I could not deploy for you.** Vercel, a domain registrar, and Google Search Console all require your credentials, payment details, and account ownership. Everything in the codebase that *can* be prepared has been. The steps below are the ones only you can perform.

### Do not deploy publicly yet

Two things should be fixed first, and both are quick:

1. **Transactional email is not connected.** The form captures the address and says the audit is coming, but nothing sends. The copy is honest about this ("we'll email it the moment it's ready"), so it is not a lie — but it is a promise with no delivery behind it.
2. **The lead magnet does not exist.** There is nothing to send even once email works.

Deploying now is fine as a **private staging deploy** (preview deploys are blocked from indexing automatically). Announcing it publicly should wait for those two items.

---

## 1. What is already prepared

| Item | Status |
|---|---|
| Production build passes | ✅ 11 routes |
| Typecheck + lint clean | ✅ |
| Security headers (HSTS, X-Frame-Options, etc.) | ✅ `next.config.ts` |
| `X-Powered-By` disabled | ✅ |
| `sitemap.xml` / `robots.txt` | ✅ Auto-generated |
| Preview deploys blocked from indexing | ✅ `isIndexable` guard |
| Canonical URLs on every page | ✅ |
| JSON-LD (Organization, WebSite, FAQPage) | ✅ Verified in rendered HTML |
| Legal pages | ✅ `/privacy`, `/terms`, `/refund-policy`, `/contact` |
| Secrets git-ignored | ✅ Verified |
| URLs derive from one env var | ✅ `src/lib/site.ts` |

---

## 2. Buy a domain

`aurevia.com` if available; otherwise `.co`, `.io`, or `aurevia.ai`.

**Avoid** hyphens, `getaurevia`, or `aurevia-hq` — they read as second-choice and undermine a premium brand.

Registrar: Cloudflare (at-cost pricing, free DNS) or Namecheap. **Do not buy the registrar's SEO/hosting upsells.**

---

## 3. Push to GitHub

The repo has a git history from scaffolding but nothing has been committed by me. Before your first push:

```bash
cd "c:/Users/PC/Desktop/AI Digital Products"
git status                       # confirm .env.local is NOT listed
git add -A
git commit -m "AUREVIA: research, schema, site foundation, SEO"
```

**Verify `.env.local` is absent from `git status` before pushing.** It contains your service-role key. It is git-ignored and this has been verified, but check anyway — a leaked service-role key gives full database access, bypassing every RLS policy.

If it ever does leak: rotate it immediately in Supabase → Settings → API.

---

## 4. Deploy to Vercel

1. Sign in to vercel.com with GitHub.
2. **Add New → Project** → import the repo.
3. Framework auto-detects as Next.js. Leave build settings alone.
4. Add environment variables **before** the first deploy:

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lbrhfocjonfxpbylsdip.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your publishable key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | your service-role key | All — **mark as Sensitive** |

> Leave the Safepay and email variables unset for now. `src/lib/env.ts` treats blank as absent, so the site runs fine without them and payment code fails loudly rather than silently if invoked.

5. Deploy.
6. **Domains** → add your domain → follow the DNS instructions.
7. Set `NEXT_PUBLIC_APP_URL` to the final domain and redeploy, so canonicals and sitemap point at the real host.

---

## 5. Point Supabase at the live domain

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://yourdomain.com`
- **Redirect URLs:** add `https://yourdomain.com/**`

Without this, email confirmation and password reset links point at localhost.

---

## 6. Verify the production deploy

```bash
curl -s https://yourdomain.com/robots.txt          # must ALLOW, not disallow
curl -s https://yourdomain.com/sitemap.xml         # URLs must be your domain
curl -sI https://yourdomain.com | grep -i strict-transport
```

**If `robots.txt` says `Disallow: /`, `VERCEL_ENV` is not `production`** — check you are testing the production deployment, not a preview.

Then confirm: all four legal pages load, the lead form writes a row to `leads`, and no console errors.

---

## 7. Google Search Console

Nothing appears in Google until this is done. **You must do this yourself** — it requires your Google account.

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. **Add property → Domain** (covers www and subdomains).
3. Add the TXT record it gives you at your DNS provider. Wait a few minutes, then verify.
4. **Sitemaps** → submit `sitemap.xml`.
5. **URL Inspection** → paste your homepage → **Request Indexing**.

Then:
- **Bing Webmaster Tools** — imports directly from Search Console in two clicks. Do it; it is free traffic.
- **Google Business Profile** — only if you want local visibility. Optional for a global digital business.

### What to expect

| When | What |
|---|---|
| 1–3 days | Homepage indexed |
| 1–2 weeks | All pages indexed |
| 1–2 months | First impressions in Search Console |
| 4–8 months | Meaningful organic traffic |

**A new domain does not rank quickly.** Do not judge SEO before month 4 — see `marketing/seo-strategy.md` §0.

---

## 8. Analytics

Currently events are recorded in the `analytics_events` table (server-side, no cookie banner needed).

If you want a dashboard, **Vercel Analytics** (privacy-friendly, no consent banner) is the lowest-friction option. Google Analytics 4 requires a cookie-consent banner in the EU/UK and would mean updating the Privacy Policy — which currently states, truthfully, that we run no third-party tracking. **If you add GA4, that page must be updated the same day.**

---

## 9. Before charging money

Not required for launch, but hard blockers on revenue:

- [ ] Safepay merchant account approved (longest lead time — start now)
- [ ] Safepay adapter completed against official docs
- [ ] Webhook endpoint registered and signature verification implemented
- [ ] `docs/safepay-testing.md` sandbox suite passed
- [ ] Legal pages reviewed by a lawyer in your jurisdiction
- [ ] Transactional email connected
- [ ] Rate limiter moved to a shared store if running multiple instances

---

## 10. Rollback

Vercel keeps every deployment. **Deployments → ⋯ → Promote to Production** on the last good one. Instant, no rebuild.

Database migrations do **not** roll back automatically. All migrations so far are additive, so a code rollback is safe.
