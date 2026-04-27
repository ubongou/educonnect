import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { requireAdmin } from "@/lib/auth";
import { getSectionForEdit } from "@/lib/marketing/content";
import {
  defaultContact,
  defaultFounders,
  defaultGlobals,
  defaultHero,
  defaultHowItWorks,
  defaultMarquee,
  defaultPricingFaq,
  defaultPricingIntro,
  defaultPricingTiers,
  defaultTestimonials,
  defaultWhyGrid,
} from "@/lib/marketing/defaults";
import { sectionRegistry, type SectionId } from "@/lib/marketing/schemas";
import { HeroForm } from "@/components/admin/marketing/HeroForm";
import { MarqueeForm } from "@/components/admin/marketing/MarqueeForm";
import { WhyGridForm } from "@/components/admin/marketing/WhyGridForm";
import { HowItWorksForm } from "@/components/admin/marketing/HowItWorksForm";
import { TestimonialsForm } from "@/components/admin/marketing/TestimonialsForm";
import { FoundersForm } from "@/components/admin/marketing/FoundersForm";
import { ContactForm } from "@/components/admin/marketing/ContactForm";
import { PricingIntroForm } from "@/components/admin/marketing/PricingIntroForm";
import { PricingTiersForm } from "@/components/admin/marketing/PricingTiersForm";
import { PricingFaqForm } from "@/components/admin/marketing/PricingFaqForm";
import { GlobalsForm } from "@/components/admin/marketing/GlobalsForm";

function isSectionId(s: string): s is SectionId {
  return Object.prototype.hasOwnProperty.call(sectionRegistry, s);
}

export default async function AdminContentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdmin();
  const { section } = await params;
  if (!isSectionId(section)) notFound();

  const reg = sectionRegistry[section];
  const form = await renderForm(section, reg);

  return (
    <Container>
      <div className="mb-4">
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-1 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-blue underline-offset-4 hover:underline"
        >
          ← All sections
        </Link>
      </div>
      {form}
    </Container>
  );
}

async function renderForm(
  id: SectionId,
  reg: (typeof sectionRegistry)[SectionId],
) {
  switch (id) {
    case "hero": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.hero.schema, defaultHero);
      return <HeroForm initial={data.content} />;
    }
    case "marquee": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.marquee.schema, defaultMarquee);
      return <MarqueeForm initial={data.content} />;
    }
    case "why_grid": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.why_grid.schema, defaultWhyGrid);
      return <WhyGridForm initial={data.content} />;
    }
    case "how_it_works": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.how_it_works.schema, defaultHowItWorks);
      return <HowItWorksForm initial={data.content} />;
    }
    case "testimonials": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.testimonials.schema, defaultTestimonials);
      return <TestimonialsForm initial={data.content} />;
    }
    case "founders": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.founders.schema, defaultFounders);
      return <FoundersForm initial={data.content} />;
    }
    case "contact": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.contact.schema, defaultContact);
      return <ContactForm initial={data.content} />;
    }
    case "pricing_intro": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.pricing_intro.schema, defaultPricingIntro);
      return <PricingIntroForm initial={data.content} />;
    }
    case "pricing_tiers": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.pricing_tiers.schema, defaultPricingTiers);
      return <PricingTiersForm initial={data.content} />;
    }
    case "pricing_faq": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.pricing_faq.schema, defaultPricingFaq);
      return <PricingFaqForm initial={data.content} />;
    }
    case "globals": {
      const data = await getSectionForEdit(reg.pageSlug, reg.sectionKey, sectionRegistry.globals.schema, defaultGlobals);
      return <GlobalsForm initial={data.content} />;
    }
  }
}
