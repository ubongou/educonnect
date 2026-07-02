"use client";

import { useState } from "react";
import clsx from "clsx";

export type FaqItem = { question: string; answer: string };

// Reuses the marketing FAQ styling (.faq-list / .faq-item / .faq-question /
// .faq-toggle / .faq-answer) from src/styles/marketing.css.
export function StrategyFAQ({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className={clsx("faq-item", open && "open")}>
            <button
              type="button"
              className="faq-question"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span>{item.question}</span>
              <span className="faq-toggle" aria-hidden="true">
                +
              </span>
            </button>
            <div className="faq-answer">{item.answer}</div>
          </div>
        );
      })}
    </div>
  );
}
