import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { countryPages, subjectBySlug, subjectPages } from "@/lib/marketing/seoPages";
import {
  JsonLdScript,
  breadcrumbJsonLd,
  faqJsonLd,
  pageMetadata,
  serviceJsonLd,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return subjectPages.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = subjectBySlug(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/tutoring/${page.slug}`,
  });
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = subjectBySlug(slug);
  if (!page) notFound();

  const path = `/tutoring/${page.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Online tutoring", path: "/tutoring" },
    { name: page.name, path },
  ];

  return (
    <>
      <JsonLdScript
        data={[
          serviceJsonLd({
            name: `Online ${page.linkLabel.toLowerCase()}`,
            description: page.description,
            path,
            serviceType: page.linkLabel,
            currency: page.currency ?? "USD",
          }),
          faqJsonLd(page.faqs),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <LandingPage
        breadcrumb={crumbs}
        eyebrow={`${page.name} · One to one · Online`}
        h1={page.h1}
        intro={page.intro}
        bookingSource="seo-subject"
        currency={page.currency ?? "USD"}
        blocks={[
          { title: "Who it's for", items: page.whoFor },
          { title: page.coversTitle, items: page.covers },
        ]}
        approach={{ title: "How lessons work", items: page.approach }}
        faqs={page.faqs}
        related={[
          {
            title: "Other subjects",
            links: subjectPages
              .filter((s) => s.slug !== page.slug)
              .map((s) => ({ href: `/tutoring/${s.slug}`, label: s.linkLabel })),
          },
          {
            title: "Where we teach",
            links: countryPages.map((c) => ({
              href: `/online-tutoring/${c.slug}`,
              label: `Online tutoring in ${c.country}`,
            })),
          },
        ]}
      />
    </>
  );
}
