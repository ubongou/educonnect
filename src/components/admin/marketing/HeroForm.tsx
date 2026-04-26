"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, TextInput, FieldGroup } from "./fields";
import { ImageUploadField } from "./ImageUploadField";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { HeroContent } from "@/lib/marketing/schemas";

export function HeroForm({ initial }: { initial: HeroContent }) {
  const [content, setContent] = useState<HeroContent>(initial);

  return (
    <SectionFormShell
      sectionId="hero"
      title="Hero"
      description="The first thing visitors see at the top of the homepage."
      getContent={() => content}
    >
      <FieldGroup title="Copy">
        <TextArea
          label="Heading"
          value={content.heading}
          rows={2}
          onChange={(v) => setContent({ ...content, heading: v })}
        />
        <TextArea
          label="Subheading"
          value={content.subheading}
          rows={4}
          onChange={(v) => setContent({ ...content, subheading: v })}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Primary CTA label"
            value={content.primaryCtaLabel}
            onChange={(v) => setContent({ ...content, primaryCtaLabel: v })}
          />
          <TextInput
            label="Secondary CTA label"
            value={content.secondaryCtaLabel}
            onChange={(v) => setContent({ ...content, secondaryCtaLabel: v })}
          />
        </div>
        <TextInput
          label="Disclaimer (under CTAs)"
          value={content.disclaimer}
          onChange={(v) => setContent({ ...content, disclaimer: v })}
        />
      </FieldGroup>

      <FieldGroup title="Images">
        <ImageUploadField
          label="Hero photo"
          helpText="Square-ish portrait of a student. Shown right of the heading on desktop. Recommend 1000×1200 PNG with a transparent background or matching yellow."
          section="hero"
          slot="hero-photo"
          storagePath={content.heroImagePath}
          fallbackPreview={bundledAssets.heroImage}
          onChange={(storagePath) => setContent({ ...content, heroImagePath: storagePath })}
        />
        <TextInput
          label="Hero alt text"
          value={content.heroImageAlt}
          onChange={(v) => setContent({ ...content, heroImageAlt: v })}
          hint="Read by screen readers. Describe what's in the image."
        />
        <ImageUploadField
          label="Backed-by-MIT badge"
          helpText="Small SVG/PNG shown above the heading. Wide aspect, transparent background."
          section="hero"
          slot="mit-badge"
          storagePath={content.mitBadgePath}
          fallbackPreview={bundledAssets.mitBadge}
          onChange={(storagePath) => setContent({ ...content, mitBadgePath: storagePath })}
        />
        <TextInput
          label="MIT badge alt text"
          value={content.mitBadgeAlt}
          onChange={(v) => setContent({ ...content, mitBadgeAlt: v })}
        />
      </FieldGroup>
    </SectionFormShell>
  );
}
