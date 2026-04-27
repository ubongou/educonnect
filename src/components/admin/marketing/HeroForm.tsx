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
        <TextInput
          label="Eyebrow (small uppercase label)"
          value={content.eyebrow}
          onChange={(v) => setContent({ ...content, eyebrow: v })}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Heading — before accent"
            value={content.headingPart1}
            onChange={(v) => setContent({ ...content, headingPart1: v })}
            hint='Example: "Personal Tutoring from "'
          />
          <TextInput
            label="Heading accent (yellow highlight)"
            value={content.headingAccent}
            onChange={(v) => setContent({ ...content, headingAccent: v })}
            hint='Example: "Nigeria’s Best"'
          />
          <TextInput
            label="Heading — after accent"
            value={content.headingPart2}
            onChange={(v) => setContent({ ...content, headingPart2: v })}
            hint='Example: " Teachers"'
          />
        </div>
        <TextArea
          label="Subheading (lead paragraph)"
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
          label="Microcopy (under CTAs)"
          value={content.microcopy}
          onChange={(v) => setContent({ ...content, microcopy: v })}
        />
      </FieldGroup>

      <FieldGroup title="Floating cards over the hero photo">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Card 1 — title"
            value={content.card1Title}
            onChange={(v) => setContent({ ...content, card1Title: v })}
          />
          <TextInput
            label="Card 1 — body"
            value={content.card1Body}
            onChange={(v) => setContent({ ...content, card1Body: v })}
          />
          <TextInput
            label="Card 2 — title"
            value={content.card2Title}
            onChange={(v) => setContent({ ...content, card2Title: v })}
          />
          <TextInput
            label="Card 2 — body"
            value={content.card2Body}
            onChange={(v) => setContent({ ...content, card2Body: v })}
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Images">
        <ImageUploadField
          label="Hero photo"
          helpText="Portrait of a student. Sits over a sky-blue panel on the right."
          section="hero"
          slot="hero-photo"
          storagePath={content.heroImagePath}
          fallbackPreview={bundledAssets.heroImage}
          onChange={(storagePath) =>
            setContent({ ...content, heroImagePath: storagePath })
          }
        />
        <TextInput
          label="Hero alt text"
          value={content.heroImageAlt}
          onChange={(v) => setContent({ ...content, heroImageAlt: v })}
        />
        <ImageUploadField
          label="Backed-by-MIT badge"
          helpText="White MIT lockup on transparent background."
          section="hero"
          slot="mit-badge"
          storagePath={content.mitBadgePath}
          fallbackPreview={bundledAssets.mitBadge}
          onChange={(storagePath) =>
            setContent({ ...content, mitBadgePath: storagePath })
          }
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
