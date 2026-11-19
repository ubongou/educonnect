"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, inputBase } from "@/components/ui/FormField";
import {
  requestPasswordReset,
  resetPasswordWithCode,
  type AuthActionState,
} from "@/lib/actions/profile";

/**
 * Two steps on one page:
 *   1. Enter email → we send a reset email containing a code (and a link).
 *   2. Enter the code + new password here → signed out to /login to sign in.
 * The code means the parent never has to open a link in the right browser.
 */
export function ForgotPasswordForm() {
  const [requestState, requestAction, isRequesting] = useActionState<AuthActionState, FormData>(
    requestPasswordReset,
    null,
  );
  const [resetState, resetAction, isResetting] = useActionState<AuthActionState, FormData>(
    resetPasswordWithCode,
    null,
  );
  // Lets "Use a different email" go back to step one.
  const [startOver, setStartOver] = useState(0);
  const [lastSent, setLastSent] = useState(0);
  // Controlled so a wrong code doesn't wipe what the parent already typed
  // (React resets uncontrolled fields after a form action).
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const sentTo = requestState?.ok && lastSent === startOver ? requestState.email : undefined;

  if (!sentTo) {
    return (
      <form
        action={(fd) => {
          setLastSent(startOver);
          return requestAction(fd);
        }}
        className="flex flex-col gap-5"
      >
        <FormField label="Email" required>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={inputBase}
          />
        </FormField>

        {requestState?.error && <ErrorNote>{requestState.error}</ErrorNote>}

        <Button type="submit" size="lg" disabled={isRequesting} className="w-full justify-center">
          {isRequesting ? "Sending…" : "Email me a reset code"}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-md border-[1.5px] border-navy/10 bg-g50 px-4 py-4 text-[14px] leading-[1.6] text-g600">
        If an account exists for <strong className="text-navy">{sentTo}</strong>, we&apos;ve
        emailed it a reset code. Type the code below and choose a new password. It can take a
        minute to arrive, so check your spam folder too.
      </p>

      <form action={resetAction} className="flex flex-col gap-5">
        <input type="hidden" name="email" value={sentTo} />
        <FormField label="Code from the email" required>
          <input
            type="text"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,12}"
            maxLength={12}
            className={`${inputBase} tracking-[0.3em]`}
          />
        </FormField>
        <FormField label="New password" required hint="At least 8 characters.">
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputBase}
          />
        </FormField>

        {resetState?.error && <ErrorNote>{resetState.error}</ErrorNote>}

        <Button type="submit" size="lg" disabled={isResetting} className="w-full justify-center">
          {isResetting ? "Updating…" : "Set new password"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <form
          action={(fd) => {
            setLastSent(startOver);
            return requestAction(fd);
          }}
        >
          <input type="hidden" name="email" value={sentTo} />
          <button
            type="submit"
            disabled={isRequesting}
            className="font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50"
          >
            {isRequesting ? "Sending…" : "Send a new code"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setStartOver((n) => n + 1)}
          className="text-g600 underline-offset-4 hover:underline"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
    >
      {children}
    </p>
  );
}
