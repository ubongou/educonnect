import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { countryBySlug, countryPages, subjectPages } from "@/lib/marketing/seoPages";
import {
  JsonLdScript,
  breadcrumbJsonLd,
  faqJsonLd,
  pageMetadata,
  serviceJsonLd,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return countryPages.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = countryBySlug(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/online-tutoring/${page.slug}`,
  });
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = countryBySlug(slug);
  if (!page) notFound();

  const path = `/online-tutoring/${page.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Online tutoring", path: "/tutoring" },
    { name: page.areaServed, path },
  ];

  return (
    <>
      <JsonLdScript
        data={[
          serviceJsonLd({
            name: `Online tutoring for Nigerian families in ${page.country}`,
            description: page.description,
            path,
            serviceType: "Online private tutoring",
            currency: page.currency,
            areaServed: [page.areaServed],
            audience: `Children of Nigerian families living in ${page.country}, primary to secondary school`,
          }),
          faqJsonLd(page.faqs),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <LandingPage
        breadcrumb={crumbs}
        eyebrow={`Nigerian families in ${page.country}`}
        h1={page.h1}
        intro={page.intro}
        bookingSource="seo-country"
        currency={page.currency}
        blocks={[
          { title: page.curriculumTitle, items: page.curriculum },
          { title: page.whyTitle, items: page.why },
        ]}
        testimonialMatch={page.testimonialMatch}
        faqs={page.faqs}
        related={[
          {
            title: "Subjects we teach",
            links: subjectPages.map((s) => ({
              href: `/tutoring/${s.slug}`,
              label: s.linkLabel,
            })),
          },
          {
            title: "Other countries",
            links: countryPages
              .filter((c) => c.slug !== page.slug)
              .map((c) => ({
                href: `/online-tutoring/${c.slug}`,
                label: `Online tutoring in ${c.country}`,
              })),
          },
        ]}
      />
    </>
  );
}
