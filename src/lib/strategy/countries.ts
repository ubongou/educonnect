// Country options for the strategy-session lead form dropdown.
//
// Deliberately SHORT. This used to be the full ~195-country list, which is a
// long scroll on a phone and the kind of field that measurably costs form
// completions. Ads for this page target the diaspora markets below, so those
// five cover nearly every real submission and anyone else picks "Other" and
// types it into the follow-up field.
//
// We store the display name (not an ISO code) because both Google Sheets and
// Zoho CRM's `Country` field expect a human-readable name.
export const COUNTRY_OTHER = "Other";

export const COUNTRIES: string[] = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Nigeria",
  COUNTRY_OTHER,
];
