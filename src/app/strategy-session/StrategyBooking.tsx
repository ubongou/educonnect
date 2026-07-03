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
import { BookingForm } from "@/components/booking/BookingForm";
import { trackEvent, trackPixel } from "@/lib/analytics";
import { recordStrategyLead } from "./leadCapture";

// The single, canonical CTA label. Do not vary this anywhere on the page.
export const CTA_LABEL = "Book My Free Strategy Session";

// Google Calendar appointment scheduler shown in-page after the form is sent.
// The visitor never leaves joinmasani.com.
const CALENDAR_SRC =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3Pw7m0MEzTPPhxFpcJwv58pLksiCgsVN_N5_ioZlWsjkaujmxDI6fn0eAxPKJ4EDtC5tQcWmdL?gv=true";

type Mode = "idle" | "form" | "calendar";

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
  const calendarRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const openForm = useCallback((src: string) => {
    setSource(src);
    setMode("form");
    // Ad-optimisation + attribution, mirroring the previous CTA behaviour.
    trackPixel("Schedule", { content_name: "strategy_session", source: src });
    trackEvent("book_strategy_session", { source: src });
    recordStrategyLead(src);
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

  // On successful submit, bring the freshly revealed calendar into view.
  useEffect(() => {
    if (mode !== "calendar") return;
    const el = dialogRef.current;
    if (el) el.scrollTop = 0;
    calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [mode]);

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

            {mode === "form" ? (
              <BookingForm
                bare
                source={source}
                afterSubmit="inline"
                onSuccess={() => setMode("calendar")}
                eyebrow="Free 15-minute strategy session"
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
            ) : (
              <div className="ss-calendar" ref={calendarRef}>
                <span className="eyebrow" style={{ marginBottom: 14 }}>
                  Almost there
                </span>
                <h2 className="ss-calendar-title">
                  Pick a time for your free session
                </h2>
                <p className="ss-calendar-lead">
                  Thanks — your details are on their way to us. Choose a slot
                  below and you&apos;re booked.
                </p>
                <div className="ss-calendar-frame">
                  <iframe
                    src={CALENDAR_SRC}
                    title="Masani appointment scheduling"
                    width="100%"
                    height={600}
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            )}
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
