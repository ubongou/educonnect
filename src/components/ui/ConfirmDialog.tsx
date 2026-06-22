"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type ConfirmResult = { ok: true } | { ok: false; error: string };

type Props = {
  /**
   * The clickable element that opens the dialog (usually a button or link).
   * Omit when driving the dialog in controlled mode via `open`/`onOpenChange`
   * — useful when the opener lives somewhere that unmounts (e.g. inside an
   * ActionMenu that closes on click).
   */
  trigger?: ReactNode;
  /** Controlled open state. When provided, the dialog ignores its own trigger. */
  open?: boolean;
  /** Called when the dialog wants to open/close in controlled mode. */
  onOpenChange?: (open: boolean) => void;
  /** Short imperative title, e.g. "Delete student". */
  title: string;
  /** Body copy explaining the action. */
  description?: ReactNode;
  /**
   * Cascade consequences shown as a bullet list — what else this action
   * touches (e.g. "12 lesson reports", "3 scheduled sessions"). Spelling these
   * out is the whole point of the dialog for destructive actions.
   */
  cascade?: string[];
  /** Heading above the cascade list. Defaults to a deletion-flavoured label. */
  cascadeTitle?: string;
  /**
   * When set, the confirm button stays disabled until the user types this
   * exact word (case-sensitive). Use for irreversible hard deletes — pass the
   * entity name so the admin has to mean it.
   */
  confirmWord?: string;
  /** Confirm button label. Defaults to the title. */
  confirmLabel?: string;
  /** Visual weight of the confirm button. */
  tone?: "danger" | "default";
  /** The action to run on confirm. Return ok:false to surface an error inline. */
  onConfirm: () => Promise<ConfirmResult>;
  /** Runs after a successful confirm. Defaults to router.refresh(). */
  onSuccess?: () => void;
};

/**
 * Shared confirmation modal for management actions across the admin portal.
 *
 * One component handles both soft actions (cancel, archive — no confirmWord)
 * and irreversible hard deletes (pass `confirmWord` to force type-to-confirm
 * and `cascade` to list what gets removed). Keeps every destructive flow
 * consistent instead of one-off `window.confirm` calls.
 */
export function ConfirmDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  cascade,
  cascadeTitle = "This will also remove",
  confirmWord,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onSuccess,
}: Props) {
  const router = useRouter();
  const controlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (controlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  };
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    if (controlled) onOpenChange?.(false);
    else setUncontrolledOpen(false);
    setTyped("");
    setError(null);
  }, [controlled, onOpenChange]);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (!open) return;
    (confirmWord ? inputRef.current : confirmBtnRef.current)?.focus();
  }, [open, confirmWord]);

  const ready = !confirmWord || typed === confirmWord;

  const run = () => {
    if (!ready || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await onConfirm();
      if (res.ok) {
        close();
        if (onSuccess) onSuccess();
        else router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger}
        </span>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default bg-navy/40"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <h2
              id={titleId}
              className="font-heading text-[20px] font-semibold tracking-[-0.01em] text-navy"
            >
              {title}
            </h2>

            {description && (
              <div className="mt-2 text-[14px] text-g600">{description}</div>
            )}

            {cascade && cascade.length > 0 && (
              <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 p-4">
                <p className="font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-coral">
                  {cascadeTitle}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-[13px] text-navy">
                  {cascade.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {confirmWord && (
              <label className="mt-4 flex flex-col gap-[7px]">
                <span className="text-[13px] text-g600">
                  Type <span className="font-semibold text-navy">{confirmWord}</span> to
                  confirm.
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") run();
                  }}
                  autoComplete="off"
                  className="rounded-md border border-line px-3 py-2 text-[14px] outline-none focus:border-navy"
                />
              </label>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={run}
                disabled={!ready || pending}
                className={`inline-flex items-center gap-2 rounded-pill border-2 px-5 py-[9px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                  tone === "danger"
                    ? "border-navy bg-coral"
                    : "border-navy bg-navy"
                }`}
              >
                {pending ? "Working…" : confirmLabel ?? title}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
