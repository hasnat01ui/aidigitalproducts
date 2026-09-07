import type { MetadataRoute } from "next";

import { absoluteUrl, isIndexable } from "@/lib/site";

/**
 * Preview and development deployments are blocked from indexing entirely.
 * A preview URL in Google's index competes with the real domain for identical
 * content, and removing it afterwards is slow and manual.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, transactional or duplicate-prone areas. None of these
        // provide search value and all of them leak surface area.
        disallow: [
          "/api/",
          "/dashboard",
          "/admin",
          "/checkout",
          "/payment/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
