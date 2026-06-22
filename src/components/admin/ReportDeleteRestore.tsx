"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { setReportDeleted } from "@/lib/actions/reports";

/**
 * Delete (soft) or Restore control for a lesson report on the admin reports
 * page. Soft-delete is reversible — it just hides the report from parents,
 * teachers, and the charts — so no type-to-confirm is needed; the deleted
 * report stays restorable from the "Recently deleted" list.
 */
export function ReportDeleteRestore({
  reportId,
  deleted,
}: {
  reportId: string;
  deleted: boolean;
}) {
  if (deleted) {
    return (
      <ConfirmDialog
        title="Restore report"
        tone="default"
        confirmLabel="Restore"
        description="The report reappears for the parent and teacher and re-enters the progression charts."
        onConfirm={() => setReportDeleted(reportId, false)}
        trigger={
          <button
            type="button"
            className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-blue underline-offset-4 hover:underline"
          >
            Restore
          </button>
        }
      />
    );
  }

  return (
    <ConfirmDialog
      title="Delete report"
      confirmLabel="Delete report"
      description="The report is hidden from the parent and teacher and drops out of the progression charts. You can restore it from the Recently deleted list at the bottom of this page."
      onConfirm={() => setReportDeleted(reportId, true)}
      trigger={
        <button
          type="button"
          className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-coral underline-offset-4 hover:underline"
        >
          Delete
        </button>
      }
    />
  );
}
