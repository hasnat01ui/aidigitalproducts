import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "AUREVIA — Intelligence. Packaged for Growth.",
    template: "%s — AUREVIA",
  },
  description:
    "AUREVIA builds the operating method for AI in small agencies — the workflows, standards and review gates that turn the tools you already pay for into consistent client work.",
  openGraph: {
    type: "website",
    siteName: "AUREVIA",
    title: "AUREVIA — Intelligence. Packaged for Growth.",
    description:
      "The operating method for AI in small agencies. Deliver more client work, at a consistent standard, without hiring.",
    url: appUrl,
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
