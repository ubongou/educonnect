"use client";

import { useState, useTransition, type ReactNode } from "react";
import { updateSection } from "@/lib/actions/marketing";
import type { SectionId } from "@/lib/marketing/schemas";

/**
 * Wraps a per-section editor: title + description at the top, the form
 * fields in the middle, and a sticky save bar at the bottom. The parent
 * form holds the content state and passes a snapshot to `getContent()`
 * when Save is clicked. We keep validation entirely server-side via the
 * registered Zod schema in `updateSection`.
 */
export function SectionFormShell({
  sectionId,
  title,
  description,
  getContent,
  children,
}: {
  sectionId: SectionId;
  title: string;
  description: string;
  getContent: () => unknown;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "error";
    msg: string;
  } | null>(null);

  function onSave() {
    setFeedback(null);
    const content = getContent();
    startTransition(async () => {
      const result = await updateSection(sectionId, content);
      if (!result.ok) {
        setFeedback({ tone: "error", msg: result.error });
        return;
      }
      setFeedback({
        tone: "ok",
        msg: `Saved · live on the site`,
      });
    });
  }

  return (
    <div className="pb-32">
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Site content
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          {title}
        </h1>
        <p className="mt-2 text-[14px] text-g600">{description}</p>
      </div>

      <div className="flex flex-col gap-5">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-navy/10 bg-white/95 px-10 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div className="text-[12px] text-g600">
            {feedback ? (
              <span
                className={
                  feedback.tone === "error"
                    ? "font-semibold text-coral"
                    : "font-semibold text-blue"
                }
              >
                {feedback.msg}
              </span>
            ) : (
              <span>Changes go live the moment you save.</span>
            )}
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="rounded-pill border-2 border-navy bg-coral px-6 py-2 font-heading text-[13px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-coral/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save section"}
          </button>
        </div>
      </div>
    </div>
  );
}
