"use client";

import { useSearchParams } from "next/navigation";
import { normalizeSource } from "@/lib/booking/schema";
import { BookingForm } from "./BookingForm";

// Thin route adapter for /book: reads the ?source= attribution param (which is
// why it needs a Suspense boundary) and hands it to the shared BookingForm.
// The /strategy-session modal renders BookingForm directly with its own source.
export function BookingFormRoute() {
  const params = useSearchParams();
  return <BookingForm source={normalizeSource(params.get("source"))} />;
}
