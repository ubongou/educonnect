"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { requestEnrollments } from "@/lib/actions/enrollments";

export type EnrollSubject = { id: string; name: string; slug: string };

export function EnrollForm({
  studentId,
  subjects,
}: {
  studentId: string;
  subjects: EnrollSubject[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestEnrollments(studentId, Array.from(selected));
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/dashboard?child=${studentId}&requested=1`);
    });
  };

  if (subjects.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
        <p className="text-[14px] text-g600">
          Your child is already enrolled or requested for every subject we offer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {subjects.map((s) => {
          const checked = selected.has(s.id);
          return (
            <li key={s.id}>
              <label
                className={`flex cursor-pointer items-center gap-4 rounded-[28px] border bg-white px-5 py-4 transition-colors ${
                  checked ? "border-navy" : "border-navy/10 hover:border-navy/30"
                }`}
              >
                <input
                  type="checkbox"
                  name="subjectIds"
                  value={s.id}
                  checked={checked}
                  onChange={() => toggle(s.id)}
                  className="h-5 w-5 accent-navy"
                />
                <span className="font-heading text-[16px] font-semibold text-navy">
                  {s.name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 rounded-[28px] border border-line bg-white p-5">
        <p className="text-[13px] text-g600">
          Admin reviews each request and matches a teacher.
        </p>
        <Button type="submit" size="lg" disabled={pending || selected.size === 0}>
          {pending ? "Sending…" : "Request selected"}
        </Button>
      </div>
    </form>
  );
}
