import { LegalPage } from "@/components/marketing/LegalPage";
import { LEGAL_UPDATED, safeguardingIntro, safeguardingSections } from "@/lib/marketing/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Safeguarding: How We Keep Children Safe",
  description:
    "How Masani keeps children safe in one to one online lessons: teacher checks, how lessons run, recordings, and how to raise a concern.",
  path: "/safeguarding",
});

export default function SafeguardingPage() {
  return (
    <LegalPage
      eyebrow="Safeguarding"
      title="How we keep children safe"
      updated={LEGAL_UPDATED}
      intro={safeguardingIntro}
      sections={safeguardingSections}
      related={[
        { href: "/privacy", label: "Privacy notice" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/about", label: "About Masani" },
      ]}
    />
  );
}
