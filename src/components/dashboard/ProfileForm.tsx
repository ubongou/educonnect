"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { updateProfile, type AuthActionState } from "@/lib/actions/profile";

export function ProfileForm({
  defaultFullName,
  defaultPhone,
  email,
}: {
  defaultFullName: string;
  defaultPhone: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    updateProfile,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="Email" hint="To change your email, contact support.">
        <input type="email" value={email} disabled readOnly className={`${inputBase} bg-g50`} />
      </FormField>
      <FormField label="Full name" required>
        <input
          type="text"
          name="full_name"
          required
          defaultValue={defaultFullName}
          autoComplete="name"
          className={inputBase}
        />
      </FormField>
      <FormField label="Phone number">
        <input
          type="tel"
          name="phone"
          defaultValue={defaultPhone}
          autoComplete="tel"
          className={inputBase}
        />
      </FormField>

      {state?.ok && (
        <p
          role="status"
          className="rounded-md border-[1.5px] border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
        >
          Profile updated.
        </p>
      )}
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
