import type { MarqueeContent } from "@/lib/marketing/schemas";

export function Marquee({ content }: { content: MarqueeContent }) {
  const subjects = content.subjects;
  return (
    <div className="container">
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>
            {subjects.map((s, i) => (
              <span key={`a-${i}`}>
                {s} <span className="pip" />
              </span>
            ))}
          </span>
          <span aria-hidden="true">
            {subjects.map((s, i) => (
              <span key={`b-${i}`}>
                {s} <span className="pip" />
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
