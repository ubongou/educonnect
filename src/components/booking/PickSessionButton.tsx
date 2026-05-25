"use client";

import { trackEvent } from "@/lib/analytics";

export function PickSessionButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-coral"
      onClick={() => trackEvent("booking_complete", {})}
    >
      Pick your session time
    </a>
  );
}
