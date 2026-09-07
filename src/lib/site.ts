/**
 * Canonical site configuration.
 *
 * Every URL in metadata, sitemap, robots and structured data derives from
 * `siteUrl`, so switching from a preview deployment to the real domain is one
 * environment variable rather than a search-and-replace across the codebase.
 *
 * Getting this wrong is expensive in SEO terms: canonical tags pointing at
 * localhost or a preview URL tell Google the real domain is a duplicate.
 */

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // Vercel sets this automatically on preview deployments.
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const site = {
  name: "AUREVIA",
  tagline: "Intelligence. Packaged for Growth.",
  url: siteUrl,
  description:
    "AUREVIA builds the operating method for AI in small agencies — the workflows, standards and review gates that turn the tools you already pay for into consistent client work.",
  shortDescription:
    "The operating method for AI in small agencies. Recover the hours lost to proposals, onboarding and reporting — without hiring.",
  locale: "en",
  contactEmail: "hello@aurevia.com",
} as const;

/**
 * Whether this deployment should be indexed by search engines.
 *
 * Preview and development deployments must never be indexed — a preview URL in
 * Google's index competes with the real domain for the same content and is
 * awkward to remove once it lands.
 */
export const isIndexable =
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV);

export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
