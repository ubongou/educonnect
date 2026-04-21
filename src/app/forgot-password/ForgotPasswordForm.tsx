"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { requestPasswordReset, type AuthActionState } from "@/lib/actions/profile";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    requestPasswordReset,
    null,
  );

  if (state?.ok) {
    return (
      <p className="rounded-md border-[1.5px] border-navy/10 bg-g50 px-4 py-4 text-[14px] leading-[1.6] text-g600">
        If an account exists for that email, a password reset link is on its way. Check your inbox
        (and spam folder).
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="Email" required>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
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
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
