"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import {
  StudentFormFields,
  emptyStudentFields,
  toStudentPayload,
  type StudentFieldValues,
} from "@/components/admin/StudentFormFields";
import { createStudentAsAdmin } from "@/lib/actions/students";

export type ParentOption = { id: string; label: string };

/**
 * Admin form to create a student. Optionally links an existing parent. On
 * success it jumps straight to the new student's detail page.
 */
export function StudentCreateForm({ parents }: { parents: ParentOption[] }) {
  const router = useRouter();
  const [values, setValues] = useState<StudentFieldValues>(emptyStudentFields);
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (patch: Partial<StudentFieldValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createStudentAsAdmin({
        ...toStudentPayload(values),
        parent_id: parentId || null,
      });
      if (res.ok) {
        router.push(`/admin/students/${res.studentId}`);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6"
    >
      <StudentFormFields values={values} onChange={onChange} />

      <FormField
        label="Link to parent"
        hint="Optional — connects this student to an existing parent account."
      >
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className={inputBase}
        >
          <option value="">No parent link</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </FormField>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create student"}
      </Button>
    </form>
  );
}
