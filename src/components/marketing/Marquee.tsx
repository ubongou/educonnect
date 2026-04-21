const items = [
  "Personal Tutoring",
  "Nigeria's Best Teachers",
  "One-on-One",
  "Maths · English · Science",
  "Backed by MIT",
  "10+ Years Tutor Experience",
  "British · Nigerian · American Curricula",
  "Per-Lesson Reports",
];

export function Marquee() {
  // Two copies in a row so the CSS animation wraps seamlessly.
  const loop = [...items, ...items];
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y-2 border-navy bg-yellow py-4"
    >
      <div className="marquee-track flex min-w-max items-center gap-8">
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-heading text-[16px] font-extrabold uppercase tracking-[0.1em] text-navy">
              {t}
            </span>
            <span className="h-2 w-2 rounded-full bg-navy" aria-hidden="true" />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 40s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
