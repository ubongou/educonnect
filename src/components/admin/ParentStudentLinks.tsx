"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { inputBase } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  linkParentToStudent,
  unlinkParentFromStudent,
} from "@/lib/actions/students";

export type LinkOption = { id: string; label: string };

/**
 * Shared picker for both link directions. Callers pass the already-filtered
 * options (existing links excluded) and a closure that runs the right server
 * action; everything else — pending state, error surface, refresh — is the same
 * on both pages.
 */
function LinkPicker({
  options,
  placeholder,
  buttonLabel,
  exhaustedMessage,
  onLink,
}: {
  options: LinkOption[];
  placeholder: string;
  buttonLabel: string;
  exhaustedMessage: string;
  onLink: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (options.length === 0) {
    return <p className="text-[13px] text-g400">{exhaustedMessage}</p>;
  }

  const submit = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await onLink(selected);
      if (res.ok) {
        setSelected("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={pending}
          aria-label={placeholder}
          className={`${inputBase} max-w-xs`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="button" onClick={submit} disabled={!selected || pending}>
          {pending ? "Linking…" : buttonLabel}
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Link an existing parent account to this student (student detail page). */
export function LinkParentToStudentForm({
  studentId,
  parents,
}: {
  studentId: string;
  parents: LinkOption[];
}) {
  return (
    <LinkPicker
      options={parents}
      placeholder="Choose a parent account…"
      buttonLabel="Link parent"
      exhaustedMessage="Every parent account is already linked to this student."
      onLink={(parentId) => linkParentToStudent(studentId, parentId)}
    />
  );
}

/** Link an existing student to this parent (parent detail page). */
export function LinkStudentToParentForm({
  parentId,
  students,
}: {
  parentId: string;
  students: LinkOption[];
}) {
  return (
    <LinkPicker
      options={students}
      placeholder="Choose a student…"
      buttonLabel="Link child"
      exhaustedMessage="Every student is already linked to this parent."
      onLink={(studentId) => linkParentToStudent(studentId, parentId)}
    />
  );
}

/**
 * Remove a parent-student link. Nothing is deleted, but the parent immediately
 * loses sight of the child, so the consequences get spelled out first.
 */
export function UnlinkButton({
  studentId,
  parentId,
  parentName,
  studentName,
}: {
  studentId: string;
  parentId: string;
  parentName: string;
  studentName: string;
}) {
  return (
    <ConfirmDialog
      title="Unlink parent"
      confirmLabel="Unlink"
      cascadeTitle={`${parentName} will lose access to`}
      cascade={[
        `${studentName}'s lesson reports`,
        `${studentName}'s sessions and schedule`,
        `${studentName}'s uploaded documents`,
      ]}
      description="No records are deleted, and you can re-link at any time. Other parents linked to this student are unaffected."
      onConfirm={() => unlinkParentFromStudent(studentId, parentId)}
      trigger={
        <button
          type="button"
          className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-coral underline-offset-4 hover:underline"
        >
          Unlink
        </button>
      }
    />
  );
}
