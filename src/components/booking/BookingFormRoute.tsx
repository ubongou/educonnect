"use client";

import { useSearchParams } from "next/navigation";
import { normalizeSource, normalizeSubject } from "@/lib/booking/schema";
import { BookingForm } from "./BookingForm";

// Thin route adapter for /book: reads the ?source= attribution param and the
// optional ?subject= pre-selection (which is why it needs a Suspense
// boundary) and hands them to BookingForm.
export function BookingFormRoute() {
  const params = useSearchParams();
  return (
    <BookingForm
      source={normalizeSource(params.get("source"))}
      subject={normalizeSubject(params.get("subject"))}
    />
  );
}
