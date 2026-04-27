import type { ReactNode } from "react";
import type { WhyGridContent } from "@/lib/marketing/schemas";

const pillarIcons: ReactNode[] = [
  <svg
    key="0"
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2 14.5 8.5 21 9 16 13.5 17.5 20 12 16.5 6.5 20 8 13.5 3 9 9.5 8.5z" />
  </svg>,
  <svg
    key="1"
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>,
  <svg
    key="2"
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>,
];

const pillarTones = ["p1", "p2", "p3"] as const;

export function WhyGrid({ content }: { content: WhyGridContent }) {
  return (
    <section className="why" id="why" aria-labelledby="why-heading">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <span className="eyebrow">{content.eyebrow}</span>
            <h2 id="why-heading" style={{ marginTop: 14 }}>
              {content.title}
            </h2>
          </div>
          <p className="reveal delay-1">{content.subtitle}</p>
        </div>

        <div className="pillars">
          {content.cards.map((card, i) => (
            <article
              key={i}
              className={`pillar ${pillarTones[i]} reveal${i > 0 ? ` delay-${i}` : ""}`}
            >
              <span className="num" aria-hidden="true">
                {card.numLabel}
              </span>
              <div className="icon" aria-hidden="true">
                {pillarIcons[i]}
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
