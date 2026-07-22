"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StudentEditForm } from "@/components/admin/StudentEditForm";
import type { StudentFieldValues } from "@/components/admin/StudentFormFields";
import {
  deleteStudent,
  setStudentArchived,
  setStudentTest,
} from "@/lib/actions/students";

/**
 * Management surface for the admin student detail page: Edit details,
 * Archive/Restore (soft), Mark/unmark as a test account (excludes it from the
 * overview count), and a guarded hard Delete that spells out the cascade and
 * requires typing the registration number to confirm.
 */
export function StudentManageBar({
  studentId,
  registrationNumber,
  archived,
  isTest,
  initial,
  cascade,
}: {
  studentId: string;
  registrationNumber: string;
  archived: boolean;
  isTest: boolean;
  initial: StudentFieldValues;
  /** Human-readable counts of what a hard delete removes. */
  cascade: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [togglingTest, startToggleTest] = useTransition();
  const [dialog, setDialog] = useState<"archive" | "restore" | "delete" | null>(
    null,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <ActionMenu label="Manage">
        <ActionMenuItem onClick={() => setEditing(true)}>
          Edit details
        </ActionMenuItem>
        {archived ? (
          <ActionMenuItem onClick={() => setDialog("restore")}>
            Restore
          </ActionMenuItem>
        ) : (
          <ActionMenuItem onClick={() => setDialog("archive")}>
            Archive
          </ActionMenuItem>
        )}
        <ActionMenuItem
          disabled={togglingTest}
          onClick={() =>
            startToggleTest(async () => {
              const res = await setStudentTest(studentId, !isTest);
              if (res.ok) router.refresh();
            })
          }
        >
          {isTest ? "Unmark as test student" : "Mark as test student"}
        </ActionMenuItem>
        <ActionMenuItem tone="danger" onClick={() => setDialog("delete")}>
          Delete permanently
        </ActionMenuItem>
      </ActionMenu>

      <ConfirmDialog
        open={dialog === "archive"}
        onOpenChange={(o) => setDialog(o ? "archive" : null)}
        title="Archive student"
        tone="default"
        confirmLabel="Archive"
        description="The student disappears from parent dashboards and the active list, but all history is kept. You can restore them anytime."
        onConfirm={() => setStudentArchived(studentId, true)}
      />

      <ConfirmDialog
        open={dialog === "restore"}
        onOpenChange={(o) => setDialog(o ? "restore" : null)}
        title="Restore student"
        tone="default"
        confirmLabel="Restore"
        description="The student becomes active again and reappears on parent dashboards."
        onConfirm={() => setStudentArchived(studentId, false)}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => setDialog(o ? "delete" : null)}
        title="Delete student permanently"
        confirmLabel="Delete student"
        confirmWord={registrationNumber}
        cascade={cascade}
        description="This cannot be undone. Consider archiving instead if you only want to hide the student."
        onConfirm={() => deleteStudent(studentId)}
        onSuccess={() => router.push("/admin/students")}
      />

      {editing && (
        <div className="w-full">
          <StudentEditForm
            studentId={studentId}
            initial={initial}
            onDone={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
