import { LegalPage } from "@/components/marketing/LegalPage";
import { LEGAL_UPDATED, privacyIntro, privacySections } from "@/lib/marketing/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Notice",
  description:
    "How Masani collects, uses and protects information about families and children, including lesson recordings, which are made only with parent consent.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy notice"
      updated={LEGAL_UPDATED}
      intro={privacyIntro}
      sections={privacySections}
      related={[
        { href: "/terms", label: "Terms of Service" },
        { href: "/safeguarding", label: "Safeguarding" },
      ]}
    />
  );
}
