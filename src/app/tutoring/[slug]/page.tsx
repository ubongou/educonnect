import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { countryPages, examPrepPages, subjectBySlug, subjectOnlyPages, subjectPages } from "@/lib/marketing/seoPages";
import {
  EXAM_COUNTRIES,
  examForPage,
  examHref,
  examsByCountry,
  examsForSubject,
  subjectLink,
  type Exam,
} from "@/lib/marketing/exams";
import { guidesForExam, guidesForSubject } from "@/lib/marketing/related";
import type { LinkSection } from "@/components/marketing/LandingPage";
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
  const isExam = page.kind === "exam";
  const exam = isExam ? examForPage(page.slug) : undefined;

  // Subject pages show the exams they prepare for, grouped by country; exam
  // pages show the subjects they cover. Both come from the same table.
  const flags = (e: Exam) =>
    e.countries
      .map((c) => EXAM_COUNTRIES.find((x) => x.id === c)?.flag)
      .filter(Boolean)
      .join(" ");
  const examCard = (e: Exam) => ({
    id: e.id,
    title: e.name,
    href: examHref(e) ?? `/exams#${e.id}`,
    meta: `${flags(e)} ${e.when}`,
    body: e.summary,
  });
  const linkSections: LinkSection[] = isExam
    ? exam
      ? [
          {
            title: `Subjects the ${exam.name} covers`,
            intro: exam.alsoTests
              ? `It also tests ${exam.alsoTests.toLowerCase()}, which aren't taught as school subjects. We teach those too.`
              : undefined,
            cards: exam.subjects.map((ref) => {
              const l = subjectLink(ref);
              return { id: ref, title: l.label, href: l.href };
            }),
          },
        ]
      : []
    : [
        {
          title: `${page.name} exams we prepare for`,
          intro: "In the UK, the US, Canada and international schools.",
          // Country order (UK, US, Canada, international), each exam once.
          cards: [...new Set(examsByCountry(examsForSubject(page.slug)).flatMap((g) => g.exams))].map(
            examCard,
          ),
        },
      ];

  const guideLinks = isExam && exam ? guidesForExam(exam.id) : guidesForSubject(page.slug);
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
        linkSections={linkSections}
        related={[
          {
            title: "For parents",
            links: [
              ...guideLinks,
              { href: "/guides/online-tutoring-for-nigerian-families-abroad", label: "How to choose an online tutor" },
              { href: "/our-promise", label: "The Masani Promise" },
            ],
          },
          {
            title: isExam ? "Other exams" : "Other subjects",
            links: [
              ...(isExam ? examPrepPages : subjectOnlyPages)
                .filter((s) => s.slug !== page.slug)
                .map((s) => ({ href: `/tutoring/${s.slug}`, label: s.linkLabel })),
              isExam
                ? { href: "/exams", label: "All exams we prepare for" }
                : { href: "/tutoring", label: "All subjects" },
            ],
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
