"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { signup, type SignupState } from "@/lib/actions/signup";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(
    signup,
    null,
  );

  if (state?.status === "check-email") {
    return (
      <div
        role="status"
        className="rounded-md border-[1.5px] border-blue/40 bg-blue/10 px-5 py-6"
      >
        <h2 className="font-heading text-[16px] font-extrabold text-navy">
          Check your email
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-navy">
          We sent a confirmation link to <strong>{state.email}</strong>. Click the link
          to finish creating your account, then sign in to add your child.
        </p>
        <p className="mt-3 text-[13px] text-g600">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue underline-offset-4 hover:underline"
          >
            try a different email
          </Link>
          .
        </p>
      </div>
    );
  }

  const values = state?.status === "error" ? state.values : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="Your full name" required>
        <input
          type="text"
          name="full_name"
          required
          autoComplete="name"
          placeholder="e.g. Adaeze Obi"
          defaultValue={values?.full_name ?? ""}
          className={inputBase}
        />
      </FormField>
      <FormField label="Email" required>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={values?.email ?? ""}
          className={inputBase}
        />
      </FormField>
      <FormField label="Phone number" required hint="Include country code.">
        <input
          type="tel"
          name="phone"
          required
          autoComplete="tel"
          placeholder="+234 801 234 5678"
          defaultValue={values?.phone ?? ""}
          className={inputBase}
        />
      </FormField>
      <FormField label="Password" required hint="At least 8 characters.">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputBase}
        />
      </FormField>

      {state?.status === "error" && (
        <p
          role="alert"
          className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-full justify-center">
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
