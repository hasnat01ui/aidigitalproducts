import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Applied at the framework level so they cover every route, including ones
 * added later. A header that has to be remembered per-page eventually gets
 * forgotten on the page that needed it most.
 */
const securityHeaders = [
  // Stop the browser guessing content types (MIME-sniffing XSS vector).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block framing entirely — nothing here is meant to be embedded, and this
  // is the clickjacking defence for a checkout flow.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin cross-site, the full URL same-site. Avoids leaking
  // query strings (e.g. order references) to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny hardware access we never request.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Force HTTPS for two years, including subdomains.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Isolate this origin from cross-origin window references.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
