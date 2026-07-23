"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { login, type AuthActionState } from "@/lib/actions/profile";

export function LoginForm({
  defaultEmail,
  from,
}: {
  defaultEmail?: string;
  /** Path the visitor was trying to reach — returned to after sign-in. */
  from?: string;
}) {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {from && <input type="hidden" name="from" value={from} />}
      <FormField label="Email" required>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          className={inputBase}
        />
      </FormField>
      <FormField label="Password" required>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
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
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
