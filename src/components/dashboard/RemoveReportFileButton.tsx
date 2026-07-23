"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteTeacherMaterial } from "@/lib/actions/teacher-materials";
import { deleteStudentDocument } from "@/lib/actions/documents";

/**
 * Removes a file already attached to a *sent* lesson report — either a teacher
 * attachment (homework/resource) or a parent's completed-homework submission.
 * Both sides need this for the "I attached the wrong thing" case; RLS scopes
 * the delete to the uploader (or an admin), so the button is only rendered for
 * whoever owns the row. Confirms first, since the file is gone for good.
 */
export function RemoveReportFileButton({
  id,
  target,
  label,
}: {
  id: string;
  /** Which pipeline the row belongs to. */
  target: "attachment" | "submission";
  /** What's being removed, shown in the confirm dialog. */
  label: string;
}) {
  const isAttachment = target === "attachment";
  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-coral hover:underline"
        >
          Remove
        </button>
      }
      title={isAttachment ? "Remove attachment" : "Remove submission"}
      confirmLabel="Remove"
      description={
        isAttachment
          ? `"${label}" will be removed from this report and deleted. Parents will no longer see it. You can attach the correct one afterwards.`
          : `"${label}" will be removed from this report and deleted. You can submit the correct one afterwards.`
      }
      onConfirm={() =>
        isAttachment ? deleteTeacherMaterial(id) : deleteStudentDocument(id)
      }
    />
  );
}
