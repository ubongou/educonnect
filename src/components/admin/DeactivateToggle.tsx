"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfileActive } from "@/lib/actions/users";

export function DeactivateToggle({
  profileId,
  active,
  size = "md",
}: {
  profileId: string;
  active: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await setProfileActive(profileId, !active);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const cls =
    size === "sm"
      ? "font-heading text-[12px] font-semibold underline-offset-4 hover:underline disabled:opacity-50"
      : "font-heading text-[13px] font-semibold underline-offset-4 hover:underline disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className={`${cls} ${active ? "text-coral hover:text-navy" : "text-blue hover:text-navy"}`}
      >
        {pending ? "Saving…" : active ? "Deactivate" : "Reactivate"}
      </button>
      {error && (
        <p className="text-[12px] font-semibold text-coral">{error}</p>
      )}
    </div>
  );
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2 py-[2px] font-heading text-[10px] font-bold uppercase tracking-[0.1em] ${
        active
          ? "border-blue/30 bg-blue/10 text-navy"
          : "border-g400/40 bg-white text-g600"
      }`}
    >
      {active ? "Active" : "Deactivated"}
    </span>
  );
}
