"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteProfile } from "@/lib/actions/users";
import {
  profileCascadeLines,
  profileCascadeTotal,
  type ProfileCascade,
} from "@/lib/admin/profileCascade";

/**
 * Permanent-delete trigger for a deactivated teacher/parent, used in the
 * collapsed "Deactivated" list section. Opens the shared ConfirmDialog: with
 * no linked history it's a plain confirm; with history it spells out the
 * cascade and requires typing the account email to force the wipe.
 */
export function DeleteProfileButton({
  profileId,
  fullName,
  email,
  cascade,
  onDeleted,
}: {
  profileId: string;
  fullName: string;
  email: string;
  cascade: ProfileCascade;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const hasHistory = profileCascadeTotal(cascade) > 0;

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:text-navy hover:underline"
        >
          Delete
        </button>
      }
      title={`Delete ${fullName}`}
      confirmLabel="Delete permanently"
      cascade={hasHistory ? profileCascadeLines(cascade) : undefined}
      confirmWord={hasHistory ? email : undefined}
      description={
        hasHistory
          ? "This permanently removes the account, its login, and everything listed below. It cannot be undone."
          : "This account has no linked records. It and its login will be permanently removed. This cannot be undone."
      }
      onConfirm={() => deleteProfile(profileId, hasHistory)}
      onSuccess={onDeleted ?? (() => router.refresh())}
    />
  );
}
