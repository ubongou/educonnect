"use client";

import { useState } from "react";
import { SectionFormShell } from "./SectionFormShell";
import { TextArea, FieldGroup } from "./fields";
import type { MarqueeContent } from "@/lib/marketing/schemas";

export function MarqueeForm({ initial }: { initial: MarqueeContent }) {
  const [text, setText] = useState(initial.subjects.join("\n"));

  return (
    <SectionFormShell
      sectionId="marquee"
      title="Marquee subjects"
      description="The scrolling subject list under the hero. One subject per line."
      getContent={() => ({
        subjects: text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      })}
    >
      <FieldGroup title="Subjects">
        <TextArea
          label="One subject per line"
          value={text}
          rows={10}
          onChange={setText}
          hint="Between 2 and 24 subjects. Order is preserved."
        />
      </FieldGroup>
    </SectionFormShell>
  );
}
