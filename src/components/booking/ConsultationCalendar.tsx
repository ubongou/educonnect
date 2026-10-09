"use client";

import { useEffect, useRef, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { trackEvent } from "@/lib/analytics";
import {
  BOOKING_EMAIL,
  BOOKING_WHATSAPP_LABEL,
  BOOKING_WHATSAPP_URL,
  CAL_LINK,
} from "@/lib/booking/cal";

// The Cal.com calendar for the main-site booking flow. Same event as
// /strategy-session/booked (see CAL_LINK), separate namespace so the two
// pages' listeners never cross. Cal shows slots in the visitor's own timezone
// and reports a confirmed booking back to this page, neither of which the old
// Google appointment link could do.
const CAL_NAMESPACE = "consultation";

// If Cal hasn't painted an iframe by now, assume it is blocked and promote
// the WhatsApp/email fallback.
const CAL_LOAD_TIMEOUT_MS = 8000;

export function ConsultationCalendar({
  source,
  name,
  email,
  whatsappHref: whatsappHrefProp,
}: {
  source: string;
  /** Prefilled into Cal's booking form so the parent doesn't retype them. */
  name?: string;
  email?: string;
  /** WhatsApp link for the fallback; defaults to a generic message. */
  whatsappHref?: string;
}) {
  const [calFailed, setCalFailed] = useState(false);
  const [booked, setBooked] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const bookedFired = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cal = await getCalApi({ namespace: CAL_NAMESPACE });
        if (cancelled) return;
        cal("ui", {
          // Pinned to light: a dark-mode phone otherwise renders a black
          // calendar inside our light card.
          theme: "light",
          cssVarsPerTheme: {
            light: { "cal-brand": "#04131C" },
            dark: { "cal-brand": "#3EBEFF" },
          },
          hideEventTypeDetails: false,
          layout: "month_view",
        });
        cal("on", {
          action: "bookingSuccessful",
          callback: () => {
            if (bookedFired.current) return;
            bookedFired.current = true;
            setBooked(true);
            trackEvent("consultation_booked", { source });
          },
        });
      } catch {
        // Cal's script never loaded. The timeout below surfaces the fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  // Poll rather than trust the promise above: a blocked script can leave
  // getCalApi() pending forever.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!shellRef.current?.querySelector("iframe")) setCalFailed(true);
    }, CAL_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const whatsappHref =
    whatsappHrefProp ??
    `${BOOKING_WHATSAPP_URL}?text=${encodeURIComponent(
      "Hi Masani, I'd like to book a free consultation for my child. Are you free for a quick call today?",
    )}`;

  return (
    <div className="booking-calendar">
      {booked ? (
        <p className="booking-calendar-done" role="status">
          You&apos;re booked. Check your email for the confirmation and call
          link.
        </p>
      ) : null}

      <div className="booking-calendar-frame" ref={shellRef}>
        <Cal
          namespace={CAL_NAMESPACE}
          calLink={CAL_LINK}
          className="booking-cal-embed"
          config={{
            layout: "month_view",
            // Also set via cal("ui"), but passing it here puts it in the
            // iframe URL so the first paint is already light.
            theme: "light",
            useSlotsViewOnSmallScreen: "true",
            ...(name ? { name } : {}),
            ...(email ? { email } : {}),
          }}
        />
      </div>

      <p className={`booking-calendar-fallback${calFailed ? " is-urgent" : ""}`}>
        {calFailed
          ? "The calendar is not loading on your device. That is on us, not you."
          : "Calendar not loading?"}{" "}
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          {BOOKING_WHATSAPP_LABEL}
        </a>{" "}
        or email <a href={`mailto:${BOOKING_EMAIL}`}>{BOOKING_EMAIL}</a> and we
        will book you in.
      </p>
    </div>
  );
}
