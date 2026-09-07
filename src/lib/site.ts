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

const FALLBACK_URL = "http://localhost:3000";

/**
 * Normalise a configured URL so it can never crash the build.
 *
 * `new URL("aurevia.com")` throws — a bare host is not a valid URL. That is
 * exactly how a domain gets typed into a hosting dashboard, and because
 * `layout.tsx` builds a `metadataBase` at module load, the throw surfaced as
 * an opaque "project or build error" rather than anything actionable.
 *
 * A misconfigured URL should degrade, not detonate: add the missing scheme,
 * strip a trailing slash, and fall back to localhost if it is still unusable.
 */
function normaliseUrl(value: string | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    console.warn(
      `[site] NEXT_PUBLIC_APP_URL is not a usable URL: ${JSON.stringify(value)}. ` +
        `Falling back to ${FALLBACK_URL}. Set it to a full origin, e.g. https://aurevia.com`,
    );
    return null;
  }
}

function resolveSiteUrl(): string {
  const explicit = normaliseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return explicit;

  // Vercel sets these automatically. VERCEL_URL is the per-deployment host.
  const vercel =
    normaliseUrl(process.env.NEXT_PUBLIC_VERCEL_URL) ??
    normaliseUrl(process.env.VERCEL_URL);
  if (vercel) return vercel;

  return FALLBACK_URL;
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
