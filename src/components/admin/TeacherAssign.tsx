"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignEnrollmentTeacher } from "@/lib/actions/enrollments";
import { inputBase } from "@/components/ui/FormField";

export type TeacherOption = { id: string; full_name: string | null };

export function TeacherAssign({
  enrollmentId,
  currentTeacherId,
  teachers,
}: {
  enrollmentId: string;
  currentTeacherId: string | null;
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [teacherId, setTeacherId] = useState<string>(currentTeacherId ?? "");
  const [error, setError] = useState<string | null>(null);

  const dirty = (teacherId || null) !== (currentTeacherId ?? null);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await assignEnrollmentTeacher(enrollmentId, teacherId || null);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
            Teacher
          </span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={pending || teachers.length === 0}
            className={`${inputBase} py-1 text-[13px]`}
          >
            <option value="">— unassigned —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name ?? "Unnamed"}
              </option>
            ))}
          </select>
        </label>
        {dirty && (
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="inline-flex items-center rounded-pill border border-navy bg-navy px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      {teachers.length === 0 && (
        <p className="text-[12px] text-g400">
          No teachers exist yet. Create one in{" "}
          <a href="/admin/teachers/new" className="underline-offset-4 hover:underline">
            Teachers
          </a>
          .
        </p>
      )}
      {error && <p className="text-[12px] font-semibold text-coral">{error}</p>}
    </div>
  );
}
