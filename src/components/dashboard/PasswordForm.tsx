"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { changePassword, type AuthActionState } from "@/lib/actions/profile";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    changePassword,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
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

      {state?.ok && (
        <p
          role="status"
          className="rounded-md border border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
        >
          Password updated.
        </p>
      )}
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
