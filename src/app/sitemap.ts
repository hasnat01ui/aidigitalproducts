import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap.
 *
 * Only public, indexable, genuinely useful pages belong here. Listing a page
 * that is thin, gated or noindexed wastes crawl budget and damages trust in
 * the sitemap as a signal.
 *
 * Product and blog routes are added here as they ship — deliberately not
 * pre-listed, because a sitemap entry that 404s is worse than an absent one.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: absoluteUrl("/refund-policy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
