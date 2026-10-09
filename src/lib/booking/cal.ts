// The one Cal.com event both booking flows embed: /strategy-session/booked and
// the main-site /book page. Change it here and both follow.
export const CAL_LINK = "masani/strategy";

// Shown when Cal is blocked or slow, so a parent always has a way to book.
export const BOOKING_WHATSAPP_URL = "https://wa.me/2349017246528";
export const BOOKING_WHATSAPP_LABEL = "WhatsApp +234 901 724 6528";
export const BOOKING_EMAIL = "admin@joinmasani.com";

/** Cal's `bookingSuccessful` payload, read defensively — we only need the uid. */
export function bookingUidFrom(event: unknown): string | undefined {
  const detail = (event as { detail?: { data?: unknown } } | undefined)?.detail
    ?.data as { booking?: { uid?: unknown }; uid?: unknown } | undefined;
  const uid = detail?.booking?.uid ?? detail?.uid;
  return typeof uid === "string" ? uid : undefined;
}
