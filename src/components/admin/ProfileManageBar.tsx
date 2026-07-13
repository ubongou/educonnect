"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionMenu, ActionMenuItem } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusPill } from "@/components/admin/DeactivateToggle";
import { AdminProfileEditForm } from "@/components/admin/AdminProfileEditForm";
import {
  deleteProfile,
  reassignTeacher,
  setProfileActive,
} from "@/lib/actions/users";
import {
  profileCascadeLines,
  profileCascadeTotal,
  type ProfileCascade,
} from "@/lib/admin/profileCascade";

export type ReassignInfo = {
  /** Other active teachers this teacher's workload can move to. */
  targets: { id: string; name: string }[];
  enrollmentCount: number;
  sessionCount: number;
};

const EMPTY_CASCADE: ProfileCascade = {
  sessions: 0,
  reports: 0,
  materials: 0,
  messages: 0,
  enrollmentsAssigned: 0,
  enrollmentsRequested: 0,
  documents: 0,
};

/**
 * Management surface for a parent or teacher detail page: an Actions menu with
 * Edit details and Deactivate/Reactivate, plus the inline edit form.
 *
 * For teachers, pass `reassign` so deactivation can move live enrollments and
 * scheduled sessions to another teacher in the same step — otherwise a
 * deactivated teacher's students keep pointing at someone who can't log in.
 */
export function ProfileManageBar({
  profileId,
  fullName,
  phone,
  email,
  active,
  reassign,
  cascade = EMPTY_CASCADE,
  listHref,
}: {
  profileId: string;
  fullName: string;
  phone: string;
  email: string;
  active: boolean;
  reassign?: ReassignInfo;
  /** What a permanent delete would remove — drives safe-vs-force. */
  cascade?: ProfileCascade;
  /** Where to send the admin after a successful delete (the list page). */
  listHref: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  // Dialog state lives here (not inside ActionMenu) so it survives the menu
  // closing on click.
  const [dialog, setDialog] = useState<
    "deactivate" | "reactivate" | "delete" | null
  >(null);

  const hasHistory = profileCascadeTotal(cascade) > 0;

  const liveLoad = reassign
    ? reassign.enrollmentCount + reassign.sessionCount
    : 0;
  const canReassign = !!reassign && reassign.targets.length > 0 && liveLoad > 0;

  const deactivate = async () => {
    if (reassignTo) {
      const moved = await reassignTeacher(profileId, reassignTo);
      if (!moved.ok) return moved;
    }
    return setProfileActive(profileId, false);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <StatusPill active={active} />
        <ActionMenu label="Manage">
          <ActionMenuItem onClick={() => setEditing(true)}>
            Edit details
          </ActionMenuItem>
          {active ? (
            <ActionMenuItem tone="danger" onClick={() => setDialog("deactivate")}>
              Deactivate
            </ActionMenuItem>
          ) : (
            <>
              <ActionMenuItem onClick={() => setDialog("reactivate")}>
                Reactivate
              </ActionMenuItem>
              <ActionMenuItem tone="danger" onClick={() => setDialog("delete")}>
                Delete permanently
              </ActionMenuItem>
            </>
          )}
        </ActionMenu>
      </div>

      <ConfirmDialog
        open={dialog === "deactivate"}
        onOpenChange={(o) => setDialog(o ? "deactivate" : null)}
        title={`Deactivate ${fullName}`}
        tone="default"
        confirmLabel="Deactivate"
        cascadeTitle="Currently assigned"
        cascade={
          canReassign
            ? [
                `${reassign!.enrollmentCount} active enrollment${reassign!.enrollmentCount === 1 ? "" : "s"}`,
                `${reassign!.sessionCount} upcoming session${reassign!.sessionCount === 1 ? "" : "s"}`,
              ]
            : undefined
        }
        description={
          <div className="flex flex-col gap-3">
            <p>
              They can no longer sign in, but all their records stay intact and
              keep rendering.
            </p>
            {canReassign && (
              <label className="flex flex-col gap-[7px]">
                <span className="text-[13px] font-semibold text-navy">
                  Reassign their workload to
                </span>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="rounded-md border border-line px-3 py-2 text-[14px] outline-none focus:border-navy"
                >
                  <option value="">Leave assigned to {fullName}</option>
                  {reassign!.targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        }
        onConfirm={deactivate}
        onSuccess={() => {
          setReassignTo("");
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={dialog === "reactivate"}
        onOpenChange={(o) => setDialog(o ? "reactivate" : null)}
        title={`Reactivate ${fullName}`}
        tone="default"
        confirmLabel="Reactivate"
        description="They'll be able to sign in again."
        onConfirm={() => setProfileActive(profileId, true)}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => setDialog(o ? "delete" : null)}
        title={`Delete ${fullName}`}
        confirmLabel="Delete permanently"
        cascade={hasHistory ? profileCascadeLines(cascade) : undefined}
        confirmWord={hasHistory ? email : undefined}
        description={
          hasHistory
            ? "This permanently removes the account, its login, and everything below. It cannot be undone."
            : "This account has no linked records. It and its login will be permanently removed. This cannot be undone."
        }
        onConfirm={() => deleteProfile(profileId, hasHistory)}
        onSuccess={() => router.push(listHref)}
      />

      {editing && (
        <div className="w-full">
          <AdminProfileEditForm
            profileId={profileId}
            defaultFullName={fullName}
            defaultPhone={phone}
            defaultEmail={email}
            onDone={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
