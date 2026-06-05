"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { PricingFaqContent } from "@/lib/marketing/schemas";

export function PricingFAQ({ content }: { content: PricingFaqContent }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter((n): n is HTMLDivElement => n !== null);
    if (nodes.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.faqIndex);
            setRevealed((prev) => {
              if (prev.has(idx)) return prev;
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [content.items.length]);

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
                ref={(node) => {
                  itemRefs.current[i] = node;
                }}
                data-faq-index={i}
                className={clsx(
                  "faq-item reveal",
                  i > 0 && `delay-${Math.min(i, 3)}`,
                  revealed.has(i) && "visible",
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
