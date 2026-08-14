"use client";

import { useEffect, useRef, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { trackBookingCompleted, trackLeadSubmitted } from "@/lib/analytics";
import { readLead, takeLeadForConversion, type LeadHandoff } from "../leadHandoff";

// Cal.com replaced the Google Calendar appointment schedule for one reason
// above all: Google rendered every slot in the CALENDAR OWNER's timezone with
// no selector, so a parent in London or Toronto read New York times and either
// gave up or booked the wrong hour. Cal detects the visitor's timezone and
// exposes a switcher. Everything else here (prefill, booking tracking) is only
// possible because Cal talks back to the parent page; the Google iframe never did.
const CAL_NAMESPACE = "strategy";
const CAL_LINK = "masani/strategy";

// If Cal hasn't painted an iframe by now, assume it is blocked (privacy
// extension, corporate proxy, dead connection) and show the manual path
// instead of leaving the visitor staring at an empty box on the one page
// where failure costs the entire acquisition.
const CAL_LOAD_TIMEOUT_MS = 8000;

/** Cal's `bookingSuccessful` payload, read defensively — we only need the uid. */
function bookingUidFrom(event: unknown): string | undefined {
  const detail = (event as { detail?: { data?: unknown } } | undefined)?.detail
    ?.data as { booking?: { uid?: unknown }; uid?: unknown } | undefined;
  const uid = detail?.booking?.uid ?? detail?.uid;
  return typeof uid === "string" ? uid : undefined;
}

export function BookedCalendar() {
  const [lead, setLead] = useState<LeadHandoff | null>(null);
  const [calFailed, setCalFailed] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // Guards against firing twice — this is the Meta `Lead` conversion, so it
  // must fire at most once per real submission.
  const leadFired = useRef(false);
  useEffect(() => {
    if (leadFired.current) return;
    leadFired.current = true;
    setLead(readLead());
    const fresh = takeLeadForConversion();
    if (fresh) trackLeadSubmitted(fresh.source, fresh);
  }, []);

  // The booking itself — the event that actually matters to the business, and
  // the one Meta campaigns should optimise for. Cal fires this in the parent
  // page once a slot is confirmed.
  const bookingFired = useRef(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cal = await getCalApi({ namespace: CAL_NAMESPACE });
        if (cancelled) return;
        cal("ui", {
          // Pinned to light. Cal otherwise follows the visitor's OS setting,
          // and a dark-mode phone rendered a black calendar inside our light
          // paper card — unreadable, on the one screen that has to work.
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
          callback: (event: unknown) => {
            if (bookingFired.current) return;
            bookingFired.current = true;
            const current = readLead();
            trackBookingCompleted(
              current?.source ?? "ss-unknown",
              {
                email: current?.email,
                phone: current?.phone,
                name: current?.name,
              },
              bookingUidFrom(event),
            );
          },
        });
      } catch {
        // Cal's script never loaded. The timeout below surfaces the fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Did Cal actually render? Poll rather than trust the promise above, because
  // a blocked script can leave getCalApi() pending forever.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!shellRef.current?.querySelector("iframe")) setCalFailed(true);
    }, CAL_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <h1 className="ss-calendar-title">One last step: pick your time</h1>
      <p className="ss-calendar-lead">
        You are <strong>not booked yet</strong>. Choose a slot below. Times show
        in your own timezone.
      </p>

      <div className="ss-calendar-frame" ref={shellRef}>
        <Cal
          namespace={CAL_NAMESPACE}
          calLink={CAL_LINK}
          className="ss-cal-embed"
          config={{
            layout: "month_view",
            // Also set via cal("ui") below, but passing it here puts it in the
            // iframe URL so the first paint is already light — otherwise a
            // dark-mode phone flashes a black calendar before the ui message
            // arrives.
            theme: "light",
            // Cal's mobile-optimised slot picker: without this the month grid
            // and the slot list fight for the same small viewport.
            useSlotsViewOnSmallScreen: "true",
            // Prefilled from what they just typed, so nobody re-enters their
            // name and email one step after giving them to us.
            ...(lead?.name ? { name: lead.name } : {}),
            ...(lead?.email ? { email: lead.email } : {}),
          }}
        />
      </div>

      <p className={`ss-calendar-fallback${calFailed ? " is-urgent" : ""}`}>
        {calFailed
          ? "The calendar is not loading on your device. That is on us, not you."
          : "Calendar not loading?"}{" "}
        <a
          href="https://wa.me/2349017246528?text=Hi%20Masani%2C%20I%20just%20requested%20my%20child%27s%20free%20learning%20plan%20and%20would%20like%20to%20book%20my%20strategy%20session."
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp +234 901 724 6528
        </a>{" "}
        or email{" "}
        <a href="mailto:admin@joinmasani.com">admin@joinmasani.com</a> and we
        will book you in.
      </p>
    </>
  );
}
