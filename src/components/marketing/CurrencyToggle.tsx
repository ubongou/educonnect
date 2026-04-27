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
