"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A compact "Actions" dropdown for entity detail/row management. The trigger
 * toggles a popover; clicking outside or pressing Escape closes it. Menu items
 * are passed as children — use <ActionMenuItem> for plain actions, or drop in a
 * <ConfirmDialog> trigger / <Link> for richer ones. Items close the menu when
 * activated (the popover listens for clicks in the capture phase).
 */
export function ActionMenu({
  label = "Actions",
  children,
  align = "right",
}: {
  label?: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-pill border border-navy/30 bg-white px-4 py-[7px] font-heading text-[13px] font-semibold text-navy transition-colors hover:bg-paper"
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={`absolute z-40 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.16)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * A plain action row inside an <ActionMenu>. For destructive items, set
 * `tone="danger"`; for ones that open a confirm, pass the <ConfirmDialog>
 * trigger as the child of the menu instead.
 */
export function ActionMenuItem({
  onClick,
  children,
  tone = "default",
  disabled = false,
}: {
  onClick?: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`block w-full px-4 py-2 text-left font-heading text-[13px] font-semibold transition-colors hover:bg-paper disabled:opacity-40 ${
        tone === "danger" ? "text-coral" : "text-navy"
      }`}
    >
      {children}
    </button>
  );
}
