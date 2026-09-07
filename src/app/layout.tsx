import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { site, siteUrl } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  // siteUrl is normalised in @/lib/site and is always a valid origin, so this
  // cannot throw at module load and take the whole build down with it.
  metadataBase: new URL(siteUrl),
  title: {
    default: "AUREVIA — Intelligence. Packaged for Growth.",
    template: "%s — AUREVIA",
  },
  description:
    "AUREVIA builds the operating method for AI in small agencies — the workflows, standards and review gates that turn the tools you already pay for into consistent client work.",
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "AUREVIA — Intelligence. Packaged for Growth.",
    description:
      "The operating method for AI in small agencies. Deliver more client work, at a consistent standard, without hiring.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "AUREVIA — Intelligence. Packaged for Growth.",
    description:
      "The operating method for AI in small agencies. Deliver more client work, at a consistent standard, without hiring.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
