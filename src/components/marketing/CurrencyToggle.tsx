"use client";

import clsx from "clsx";

export type Currency = "NGN" | "USD" | "GBP" | "CAD";

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  CAD: "CA$",
  NGN: "₦",
};

const order: Currency[] = ["USD", "GBP", "CAD", "NGN"];

/**
 * Best guess at the visitor's currency from their time zone. Runs in the
 * browser only. Falls back to USD.
 */
export function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London" || tz === "Europe/Belfast" || tz === "Europe/Jersey" || tz === "Europe/Guernsey" || tz === "Europe/Isle_of_Man") return "GBP";
    if (tz === "Africa/Lagos") return "NGN";
    const canada = ["Toronto", "Vancouver", "Edmonton", "Winnipeg", "Halifax", "St_Johns", "Regina", "Moncton", "Whitehorse", "Yellowknife", "Iqaluit", "Glace_Bay", "Goose_Bay", "Dawson_Creek", "Swift_Current", "Creston", "Fort_Nelson", "Rankin_Inlet", "Resolute", "Cambridge_Bay", "Inuvik", "Dawson", "Atikokan", "Blanc-Sablon"];
    if (tz.startsWith("America/") && canada.includes(tz.slice(8))) return "CAD";
    if (tz.startsWith("Canada/")) return "CAD";
  } catch {
    // Older browsers: keep the default.
  }
  return "USD";
}

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div
      className="currency-toggle"
      role="group"
      aria-label="Select currency"
    >
      {order.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={clsx("currency-btn", value === c && "active")}
        >
          {currencySymbols[c]} {c}
        </button>
      ))}
    </div>
  );
}
