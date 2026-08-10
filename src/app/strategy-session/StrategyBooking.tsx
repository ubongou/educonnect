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
import { StrategyLeadForm } from "@/components/strategy/StrategyLeadForm";
import { trackScheduleOpened, type PixelUserData } from "@/lib/analytics";
import { stashLead } from "./leadHandoff";

// The single, canonical CTA label. Do not vary this anywhere on the page.
export const CTA_LABEL = "Book Your FREE Strategy Session";

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
  const dialogRef = useRef<HTMLDivElement>(null);

  const openForm = useCallback((src: string) => {
    setSource(src);
    setMode("form");
    trackScheduleOpened(src);
  }, []);

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
  const onDone = useCallback(() => {
    window.location.href = "/strategy-session/booked";
  }, []);

  const close = useCallback(() => setMode("idle"), []);

  const open = mode !== "idle";

  // Lock body scroll + wire Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
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
          <div className="ss-modal-card" ref={dialogRef}>
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
              lead="Two minutes now. Next, you'll pick a time that works for your family."
              submitLabel={CTA_LABEL}
              reassurance={
                <>
                  <ShieldIcon />
                  <span>
                    We only use your details to prepare for your session. We
                    never share them.
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
