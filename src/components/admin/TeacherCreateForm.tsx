"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { createTeacher, type CreateTeacherState } from "@/lib/actions/teachers";

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md border border-navy/15 bg-paper px-3 py-2 font-sans text-[14px] text-navy">
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
          }}
          className="inline-flex items-center rounded-pill border border-navy/30 bg-white px-4 py-[6px] font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-navy transition-colors hover:bg-paper"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

export function TeacherCreateForm() {
  const [state, formAction, pending] = useActionState<CreateTeacherState, FormData>(
    createTeacher,
    null,
  );

  if (state?.status === "created") {
    const c = state.credentials;
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-blue/40 bg-blue/10 px-5 py-6">
          <h2 className="font-heading text-[16px] font-semibold text-navy">
            Teacher account created for {c.full_name}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.6] text-navy">
            Send these to the teacher via your usual channel. The password won&apos;t
            be shown again — if they lose it, ask them to use the &quot;Forgot your
            password&quot; link on the login page.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6">
          <CopyField label="Email" value={c.email} />
          <CopyField label="Temporary password" value={c.password} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button href="/admin/teachers">Back to teachers</Button>
          <Link
            href="/admin/teachers/new"
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            Create another
          </Link>
        </div>
      </div>
    );
  }

  const values = state?.status === "error" ? state.values : null;

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-lg border border-line bg-white p-6">
      <FormField label="Full name" required>
        <input
          type="text"
          name="full_name"
          required
          autoComplete="off"
          placeholder="e.g. Ayobola Adeyemi"
          defaultValue={values?.full_name ?? ""}
          className={inputBase}
        />
      </FormField>
      <FormField label="Email" required>
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          placeholder="teacher@educonnect.com"
          defaultValue={values?.email ?? ""}
          className={inputBase}
        />
      </FormField>
      <FormField label="Phone number" hint="Optional — for admin reference.">
        <input
          type="tel"
          name="phone"
          autoComplete="off"
          placeholder="+234 801 234 5678"
          defaultValue={values?.phone ?? ""}
          className={inputBase}
        />
      </FormField>
      <FormField
        label="Temporary password"
        required
        hint="At least 8 characters. You will share this with the teacher — it won't be shown again."
      >
        <input
          type="text"
          name="password"
          required
          minLength={8}
          autoComplete="off"
          className={inputBase}
        />
      </FormField>

      {state?.status === "error" && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/teachers"
          className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create teacher"}
        </Button>
      </div>
    </form>
  );
}
