"use client";

import clsx from "clsx";

export type Currency = "USD" | "GBP" | "CAD" | "NGN";

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  CAD: "CA$",
  NGN: "₦",
};

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
}) {
  const currencies: Currency[] = ["USD", "GBP", "CAD", "NGN"];
  return (
    <div
      role="group"
      aria-label="Currency"
      className="inline-flex items-center gap-1 rounded-pill border-[1.5px] border-white/15 bg-white/10 p-1"
    >
      {currencies.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={clsx(
            "rounded-pill px-5 py-2 font-heading text-[13px] font-bold transition-colors",
            value === c ? "bg-yellow text-navy" : "text-white/55 hover:text-white",
          )}
        >
          {currencySymbols[c]} {c}
        </button>
      ))}
    </div>
  );
}
