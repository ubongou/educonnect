import type { Metadata } from "next";
import {
  defaultFounders,
  defaultGlobals,
  defaultPricingTiers,
} from "@/lib/marketing/defaults";

/**
 * Search and answer-engine plumbing shared by every public page: canonical
 * URLs, social previews, and the schema.org JSON-LD that tells Google and AI
 * assistants, in machine-readable form, who Masani is and what it sells.
 *
 * Facts here are pulled from lib/marketing/defaults.ts wherever they exist, so
 * the structured data can't drift from what the page actually says.
 */

/** The canonical origin. The apex domain 308s here. */
export const SITE_URL = defaultGlobals.websiteUrl.replace(/\/$/, "");
export const SITE_NAME = "Masani";

export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * The shared link-preview card (src/app/opengraph-image.tsx). Next only
 * attaches file-based images to their own segment, so nested pages that set
 * their own openGraph block must name it explicitly or they'd share with no
 * image at all.
 */
const PREVIEW_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Masani: online tutoring from vetted Nigerian teachers for families in the UK, US and Canada",
};

/**
 * Per-page metadata with a canonical URL and matching social preview. Titles
 * go through the root layout's "%s | Masani" template.
 */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  /** Use the title as-is, without the " | Masani" suffix. */
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_GB",
      url,
      title: input.title,
      description: input.description,
      images: [PREVIEW_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [PREVIEW_IMAGE],
    },
    ...(input.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// -----------------------------------------------------------------------------
// Facts reused across copy, JSON-LD, and llms.txt
// -----------------------------------------------------------------------------

export const MIT_FELLOWSHIP =
  "Masani was selected for the MIT Social Innovation Fellowship in 2025.";

export const ORG_DESCRIPTION =
  "Masani is an online tutoring company for Nigerian families living abroad. Children in the UK, US, Canada and beyond get private, one to one lessons with carefully vetted Nigerian teachers, across the UK, American, Nigerian and international curricula, from primary through secondary school.";

/** Countries we actively serve, ISO 3166 names for schema.org `areaServed`. */
export const AREAS_SERVED = [
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Nigeria",
];

type JsonLd = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#organization`;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: "Join Masani",
    url: `${SITE_URL}/`,
    logo: absoluteUrl("/brand/logo-blue-bg.png"),
    image: absoluteUrl("/brand-v2/student-hero.webp"),
    description: ORG_DESCRIPTION,
    slogan: "Personal Tutoring from World Class Teachers",
    email: defaultGlobals.adminEmail,
    telephone: `+${defaultGlobals.whatsappNumber}`,
    sameAs: [defaultGlobals.instagramUrl, defaultGlobals.facebookUrl],
    areaServed: AREAS_SERVED.map((name) => ({ "@type": "Country", name })),
    award: "MIT Social Innovation Fellowship (2025)",
    knowsAbout: [
      "Online tutoring",
      "Mathematics tutoring",
      "English tutoring",
      "Science tutoring",
      "11+ exam preparation",
      "SAT and ACT preparation",
      "Creative writing",
      "Public speaking",
      "UK National Curriculum",
      "US Common Core",
      "Nigerian curriculum",
    ],
    founder: defaultFounders.founders.map((f) => ({
      "@type": "Person",
      name: f.name,
      jobTitle: f.role,
      description: f.bio,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: defaultGlobals.adminEmail,
      telephone: `+${defaultGlobals.whatsappNumber}`,
      availableLanguage: ["English"],
      areaServed: AREAS_SERVED,
    },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export type Currency = "NGN" | "USD" | "GBP" | "CAD";

/** One Offer per package, in the given currency. */
export function packageOffers(currency: Currency, url: string): JsonLd[] {
  return defaultPricingTiers.tiers.map((t) => ({
    "@type": "Offer",
    name: `${t.sessions} one to one sessions`,
    price: t.prices[currency].total,
    priceCurrency: currency,
    url,
    availability: "https://schema.org/InStock",
    description: `${t.sessions} private online lessons (${t.duration}), ${t.prices[currency].perSession} ${currency} per session.`,
  }));
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  currency?: Currency;
  areaServed?: string[];
  audience?: string;
}): JsonLd {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url,
    provider: { "@id": ORG_ID },
    areaServed: (input.areaServed ?? AREAS_SERVED).map((name) => ({
      "@type": "Country",
      name,
    })),
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType:
        input.audience ?? "Children of Nigerian families living abroad, primary to secondary school",
    },
    offers: packageOffers(input.currency ?? "USD", absoluteUrl("/pricing")),
  };
}

export function faqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: ReadonlyArray<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/**
 * Inline JSON-LD. `<` is escaped so a stray "</script>" in copy can't break
 * out of the tag.
 */
export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
