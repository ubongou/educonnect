"use client";

import { useEffect, useRef } from "react";
import { trackLeadSubmitted } from "@/lib/analytics";
import { takeLead } from "../leadHandoff";

// Google Calendar appointment scheduler. The visitor never leaves joinmasani.com.
const CALENDAR_SRC =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3Pw7m0MEzTPPhxFpcJwv58pLksiCgsVN_N5_ioZlWsjkaujmxDI6fn0eAxPKJ4EDtC5tQcWmdL?gv=true";

export function BookedCalendar() {
  // Guards against firing twice — this is the Meta `Lead` conversion, so it
  // must fire at most once per real page load.
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const lead = takeLead();
    if (lead) trackLeadSubmitted(lead.source, lead);
  }, []);

  return (
    <>
      <h1 className="ss-calendar-title">Pick a time for your free session</h1>
      <p className="ss-calendar-lead">
        Thanks — your details are on their way to us. Choose a slot below and
        you&apos;re booked.
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
    </>
  );
}
