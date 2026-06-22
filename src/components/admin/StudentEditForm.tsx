"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  StudentFormFields,
  toStudentPayload,
  type StudentFieldValues,
} from "@/components/admin/StudentFormFields";
import { updateStudent } from "@/lib/actions/students";

/**
 * Inline admin editor for a student's core profile fields. Toggled from
 * StudentManageBar. The intake questionnaire is not edited here.
 */
export function StudentEditForm({
  studentId,
  initial,
  onDone,
}: {
  studentId: string;
  initial: StudentFieldValues;
  onDone: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<StudentFieldValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (patch: Partial<StudentFieldValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateStudent(studentId, toStudentPayload(values));
      if (res.ok) {
        router.refresh();
        onDone();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-5 rounded-2xl border border-line bg-white p-6"
    >
      <StudentFormFields values={values} onChange={onChange} />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
