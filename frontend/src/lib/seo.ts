import type { Metadata } from "next";

export const BASE_URL = "https://meta.metis-iitgn.tech";

export const DEFAULT_SEO = {
  siteName: "META IITGN",
  titleTemplate: "%s | META IITGN | Academic Resources, PYQs & Student Wiki",
  defaultTitle: "META IITGN | IIT Gandhinagar Academic Resources, PYQs & Student Wiki",
  defaultDescription: "META IITGN is the collaborative campus platform for IIT Gandhinagar. Access PYQs, exam papers, academic calendar, campus news, student blogs, clubs, events, and campus wiki.",
  defaultKeywords: [
    "META IITGN",
    "IIT Gandhinagar",
    "IITGN",
    "PYQs",
    "Previous Year Question Papers",
    "Student Resources",
    "Campus Wiki",
    "Campus News",
    "Academic Calendar",
    "Clubs",
    "Events",
    "Blogs",
    "Engineering Resources",
    "Past Year Papers",
    "IITGN Exam Papers"
  ],
  author: "IITGN Student Community",
  creator: "META IITGN Developers",
  publisher: "IIT Gandhinagar Students",
};

/**
 * Helper to generate consistent metadata with OpenGraph, Twitter, and alternates configuration
 */
export function getSeoMetadata(options: {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  imageUrl?: string;
  imageAlt?: string;
  noIndex?: boolean;
}): Metadata {
  const title = options.title ? `${options.title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.defaultTitle;
  const description = options.description 
    ? options.description.slice(0, 160) // Keep under 160 characters
    : DEFAULT_SEO.defaultDescription;
  
  const keywords = options.keywords 
    ? [...new Set([...options.keywords, ...DEFAULT_SEO.defaultKeywords])]
    : DEFAULT_SEO.defaultKeywords;

  const canonicalUrl = `${BASE_URL}${options.path || ""}`;
  const image = options.imageUrl || `${BASE_URL}/icon-512.png`;
  const alt = options.imageAlt || "META IITGN Hub";

  return {
    title: options.title ? { absolute: `${options.title} | ${DEFAULT_SEO.siteName}` } : { default: DEFAULT_SEO.defaultTitle, template: DEFAULT_SEO.titleTemplate },
    description,
    keywords,
    authors: [{ name: DEFAULT_SEO.author }],
    creator: DEFAULT_SEO.creator,
    publisher: DEFAULT_SEO.publisher,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    verification: {
      google: "google-site-verification-placeholder",
    },
    robots: options.noIndex 
      ? { index: false, follow: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: DEFAULT_SEO.siteName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@meta_iitgn",
    },
  };
}

/**
 * Returns basic JSON-LD Organization Schema
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "META IITGN",
    "url": BASE_URL,
    "logo": `${BASE_URL}/icon-512.png`,
    "description": "Collaborative educational and student resource platform at IIT Gandhinagar.",
    "sameAs": [
      "https://github.com/himanshuraj-demon/meta-iitgn",
      "https://iitgn.ac.in"
    ]
  };
}

/**
 * Returns WebSite and SearchAction Schema
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "META IITGN",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search-results?query={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Returns BreadcrumbList JSON-LD schema
 */
export function getBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((itm, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": itm.name,
      "item": `${BASE_URL}${itm.item}`,
    })),
  };
}
