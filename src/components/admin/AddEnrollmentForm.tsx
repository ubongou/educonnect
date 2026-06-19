"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEnrollmentAsAdmin } from "@/lib/actions/enrollments";
import { inputBase } from "@/components/ui/FormField";
import type { TeacherOption } from "@/components/admin/DecisionButtons";

export type StudentOption = {
  id: string;
  /** Display label, e.g. "Ada Lovelace · parent: Mary Lovelace". */
  label: string;
};

export type SubjectOption = { id: string; name: string };

export function AddEnrollmentForm({
  students,
  subjects,
  teachers,
}: {
  students: StudentOption[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (students.length === 0 || subjects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-6 text-[14px] text-g600">
        {students.length === 0
          ? "No students yet — add a student before creating an enrollment."
          : "No subjects configured yet."}
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!studentId || !subjectId) {
      setError("Pick a student and a subject.");
      return;
    }

    startTransition(async () => {
      const res = await createEnrollmentAsAdmin({
        student_id: studentId,
        subject_id: subjectId,
        teacher_id: teacherId || null,
      });
      if (res.ok) {
        setSuccess("Enrollment created and approved.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-lg border border-line bg-white p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">Student</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={inputBase}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">Subject</span>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={inputBase}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-[7px] md:max-w-xs">
        <span className="font-heading text-[13px] font-semibold text-navy">
          Teacher <span className="font-normal text-g400">(optional)</span>
        </span>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className={inputBase}
        >
          <option value="">— assign later —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name ?? "Unnamed"}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-md border border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
        >
          {success}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-6 py-[11px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create enrollment"}
        </button>
      </div>
    </form>
  );
}
