"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { StrategyLeadForm } from "@/components/strategy/StrategyLeadForm";
import { trackScheduleOpened, type PixelUserData } from "@/lib/analytics";
import { stashLead } from "./leadHandoff";

// The single, canonical CTA label. Do not vary this anywhere on the page.
export const CTA_LABEL = "Get My Child's FREE Learning Plan";

// The form's submit button is deliberately NOT the CTA label. Submitting does
// not book anything — it opens the calendar. A button that says "Book…" makes
// some share of parents believe they are finished and close the tab one step
// short of the only action that produces a consultation.
export const FORM_SUBMIT_LABEL = "Continue to pick your time";

type Mode = "idle" | "form";

type BookingContextValue = { openForm: (source: string) => void };

const BookingContext = createContext<BookingContextValue | null>(null);

export function useStrategyBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useStrategyBooking must be used within StrategyBookingProvider");
  }
  return ctx;
}

export function StrategyBookingProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [source, setSource] = useState("ss-hero");
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  const openForm = useCallback(
    (src: string) => {
      setSource(src);
      setMode("form");
      trackScheduleOpened(src);
      // Warm /booked while they fill the form in. By the time they submit, the
      // route is already in the client cache and the transition is instant.
      router.prefetch("/strategy-session/booked");
    },
    [router],
  );

  // Fired only for a genuine (non-bot) submission. Stashes the lead for
  // /strategy-session/booked to pick up — that page fires the Meta `Lead`
  // event on its own load (a real page load, not a button click), which is
  // what actually confirmed a submission happened rather than merely clicked.
  const onLeadCaptured = useCallback(
    (userData: PixelUserData) => stashLead({ ...userData, source }),
    [source],
  );

  // Navigates to the booking page. Fires for both a genuine lead and a
  // honeypot catch (via StrategyLeadForm's onDone), so a bot never learns the
  // trap exists — it just sees the same "success" page a real lead would.
  //
  // router.push, not window.location.href: the hard navigation threw away the
  // running app and reloaded the whole document, measured at ~1.8s on
  // production before Cal even started booting. The Meta `Lead` event is
  // unaffected — BookedCalendar reads the stashed lead in a useEffect, which
  // runs on a client transition exactly as it does on a full load, and
  // stashLead() has already written to sessionStorage by this point.
  const onDone = useCallback(() => {
    router.push("/strategy-session/booked");
  }, [router]);

  const close = useCallback(() => setMode("idle"), []);

  const open = mode !== "idle";

  // Lock body scroll, wire Escape, move focus into the dialog and keep Tab
  // inside it while it is open. Without the trap, tabbing out of the form lands
  // on the page behind the overlay with no visible focus ring.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Focus the card itself rather than the first field: auto-focusing a
    // <select> on a phone scrolls the modal and can pop a native picker before
    // the visitor has read the heading.
    dialogRef.current?.focus();

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const card = dialogRef.current;
      if (!card) return;
      const items = [...card.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  return (
    <BookingContext.Provider value={{ openForm }}>
      {children}

      {open && (
        <div
          className="ss-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Book your free strategy session"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="ss-modal-card" ref={dialogRef} tabIndex={-1}>
            <button
              type="button"
              className="ss-modal-close"
              aria-label="Close"
              onClick={close}
            >
              ×
            </button>

            <StrategyLeadForm
              source={source}
              onDone={onDone}
              onLeadCaptured={onLeadCaptured}
              heading="Tell us about your child"
              lead="This is what we build the plan from. Two minutes now, then you pick a time for the call."
              submitLabel={FORM_SUBMIT_LABEL}
              reassurance={
                <>
                  <ShieldIcon />
                  <span>
                    We only use your details to prepare for your call. We never
                    share them.
                  </span>
                </>
              }
            />
          </div>
        </div>
      )}
    </BookingContext.Provider>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flex: "0 0 auto", marginTop: 1, color: "var(--sky)" }}
    >
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
