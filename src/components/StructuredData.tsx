import { absoluteUrl, site } from "@/lib/site";

/**
 * JSON-LD structured data.
 *
 * Rules applied here, which matter more than the markup itself:
 *   - Only describe things that are actually true and actually on the page.
 *     Google penalises structured data that disagrees with visible content.
 *   - No `aggregateRating`, no `review`, no `Offer` until real products and
 *     real reviews exist. Fabricating them is both a policy violation and a
 *     breach of the brand's no-fake-proof rule.
 *   - FAQPage markup mirrors the FAQ that is genuinely rendered on the page.
 */

type JsonLd = Record<string, unknown>;

function JsonLdScript({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      // Content is authored here, not user input, so this is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    url: site.url,
    description: site.description,
    slogan: site.tagline,
    email: site.contactEmail,
  };

  return <JsonLdScript data={data} />;
}

export function WebSiteJsonLd() {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en",
  };

  return <JsonLdScript data={data} />;
}

export function FaqJsonLd({
  faqs,
}: {
  faqs: ReadonlyArray<{ q: string; a: string }>;
}) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return <JsonLdScript data={data} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: ReadonlyArray<{ name: string; path: string }>;
}) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };

  return <JsonLdScript data={data} />;
}
