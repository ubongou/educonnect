"use client";

import { useState } from "react";
import clsx from "clsx";
import type { PricingFaqContent } from "@/lib/marketing/schemas";

export function PricingFAQ({ content }: { content: PricingFaqContent }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="pricing-faq" aria-labelledby="faq-heading">
      <div className="container">
        <div className="faq-head">
          <div className="reveal">
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 id="faq-heading" style={{ marginTop: 14 }}>
              {content.title}
            </h2>
          </div>
          <p className="reveal delay-1">{content.intro}</p>
        </div>

        <div className="faq-list" role="list">
          {content.items.map((item, i) => {
            const isOpen = openIndex === i;
            const qId = `faq-q-${i}`;
            const aId = `faq-a-${i}`;
            return (
              <div
                key={i}
                className={clsx(
                  "faq-item reveal",
                  i > 0 && `delay-${Math.min(i, 3)}`,
                  isOpen && "open",
                )}
                role="listitem"
              >
                <button
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  id={qId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  type="button"
                >
                  <span>{item.question}</span>
                  <span className="faq-toggle" aria-hidden="true">
                    +
                  </span>
                </button>
                <div
                  className="faq-answer"
                  id={aId}
                  role="region"
                  aria-labelledby={qId}
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
