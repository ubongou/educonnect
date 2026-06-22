"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteEnrollment } from "@/lib/actions/enrollments";

/**
 * Permanently delete an enrollment from the admin student detail page. The
 * sessions FK cascades, so this removes every session on the enrollment —
 * scheduled, completed, and cancelled alike. Lesson reports survive (they have
 * no enrollment FK). Gated behind a cascade-aware confirm.
 */
export function EnrollmentDeleteButton({
  enrollmentId,
  subjectName,
}: {
  enrollmentId: string;
  subjectName: string;
}) {
  return (
    <ConfirmDialog
      title={`Delete ${subjectName} enrollment`}
      confirmLabel="Delete enrollment"
      cascade={[
        "every session on this enrollment (scheduled, completed, and cancelled)",
      ]}
      description="Lesson reports already written are kept. This can't be undone — to pause an enrollment instead, reject it. Use delete only for a mistaken enrollment."
      onConfirm={() => deleteEnrollment(enrollmentId)}
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
