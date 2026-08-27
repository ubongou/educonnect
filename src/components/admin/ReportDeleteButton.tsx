"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteLessonReport } from "@/lib/actions/reports";

/**
 * Deletes a lesson report outright — the "a teacher sent the wrong report"
 * fix. There's no soft-delete and no restore: a report the parent was never
 * meant to see shouldn't leave a marker where it used to be, so the row and
 * its files go for good and the session reopens for the correct report.
 *
 * Irreversible, so it takes a type-to-confirm and spells out the cascade.
 */
export function ReportDeleteButton({
  reportId,
  attachmentCount = 0,
  submissionCount = 0,
  messageCount = 0,
  /** Where to go afterwards. Omit to just refresh (list pages). */
  redirectTo,
  label = "Delete",
}: {
  reportId: string;
  attachmentCount?: number;
  submissionCount?: number;
  messageCount?: number;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();

  const cascade = [
    "The parent and teacher stop seeing this report entirely",
    "It drops out of the progression charts",
    "The session reopens so the correct report can be filed",
  ];
  if (attachmentCount > 0) {
    cascade.push(
      `${attachmentCount} attached file${attachmentCount === 1 ? "" : "s"} (homework / resources)`,
    );
  }
  if (submissionCount > 0) {
    cascade.push(
      `${submissionCount} homework submission${submissionCount === 1 ? "" : "s"} from the parent`,
    );
  }
  if (messageCount > 0) {
    cascade.push(
      `${messageCount} message${messageCount === 1 ? "" : "s"} on the report thread`,
    );
  }

  return (
    <ConfirmDialog
      title="Delete report"
      tone="danger"
      confirmWord="delete"
      confirmLabel="Delete report"
      description="This can't be undone. The report is removed for everyone — there's no restore, and the parent sees no gap where it was. Once the teacher files the replacement, the parent gets the usual report email."
      cascadeTitle="Deleting this report also removes"
      cascade={cascade}
      onConfirm={() => deleteLessonReport(reportId)}
      onSuccess={() => {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      }}
      trigger={
        <button
          type="button"
          className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-coral underline-offset-4 hover:underline"
        >
          {label}
        </button>
      }
    />
  );
}
