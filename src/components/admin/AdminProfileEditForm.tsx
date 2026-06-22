"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import { updateProfileAsAdmin } from "@/lib/actions/users";

/**
 * Inline admin editor for a parent's or teacher's name, phone, and email.
 * Rendered (toggled) from ProfileManageBar on the detail pages. Email edits go
 * through the service-role path in the action — see updateProfileAsAdmin.
 */
export function AdminProfileEditForm({
  profileId,
  defaultFullName,
  defaultPhone,
  defaultEmail,
  onDone,
}: {
  profileId: string;
  defaultFullName: string;
  defaultPhone: string;
  defaultEmail: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateProfileAsAdmin(profileId, {
        full_name: fullName,
        phone,
        email,
      });
      if (res.ok) {
        router.refresh();
        onDone();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-5 rounded-2xl border border-line bg-white p-6"
    >
      <FormField label="Full name" required>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className={inputBase}
        />
      </FormField>
      <FormField label="Email" hint="Changing this also updates the login email.">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputBase}
        />
      </FormField>
      <FormField label="Phone number">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputBase}
        />
      </FormField>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
