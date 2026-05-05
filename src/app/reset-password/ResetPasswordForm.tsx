"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { resetPassword, type AuthActionState } from "@/lib/actions/profile";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    resetPassword,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="New password" required hint="At least 8 characters.">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputBase}
        />
      </FormField>
      <FormField label="Confirm new password" required>
        <input
          type="password"
          name="confirm_password"
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
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
