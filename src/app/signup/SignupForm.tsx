"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { signup, type SignupState } from "@/lib/actions/signup";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(
    signup,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="Your full name" required>
        <input
          type="text"
          name="full_name"
          required
          autoComplete="name"
          placeholder="e.g. Adaeze Obi"
          className={inputBase}
        />
      </FormField>
      <FormField label="Email" required>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
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

      {state?.error && (
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
