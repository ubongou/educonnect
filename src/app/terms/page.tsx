import { LegalPage } from "@/components/marketing/LegalPage";
import { LEGAL_UPDATED, termsIntro, termsSections } from "@/lib/marketing/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms for Masani online tutoring: packages, payment, scheduling, missed lessons, cancelling, refunds and your rights.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro={termsIntro}
      sections={termsSections}
      related={[
        { href: "/our-promise", label: "Our promise" },
        { href: "/privacy", label: "Privacy notice" },
        { href: "/safeguarding", label: "Safeguarding" },
      ]}
    />
  );
}
