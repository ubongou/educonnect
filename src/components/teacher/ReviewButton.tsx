"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markHomeworkReviewed } from "@/lib/actions/homework";

/**
 * Teacher toggle for marking a parent's homework submission reviewed. Minimal:
 * a single button that flips `reviewed_at` via the SECURITY DEFINER RPC.
 */
export function ReviewButton({
  documentId,
  reviewed,
}: {
  documentId: string;
  reviewed: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const res = await markHomeworkReviewed(documentId, !reviewed);
      if (res.ok) router.refresh();
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="font-heading text-[12px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
    >
      {pending ? "…" : reviewed ? "Mark unreviewed" : "Mark reviewed"}
    </button>
  );
}
