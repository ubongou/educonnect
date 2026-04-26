import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import type { HowItWorksContent } from "@/lib/marketing/schemas";

export function HowItWorks({
  content,
  bookingUrl,
}: {
  content: HowItWorksContent;
  bookingUrl: string;
}) {
  return (
    <section id="how-it-works" className="bg-navy px-10 py-24">
      <Container>
        <div className="grid items-start gap-16 md:grid-cols-[1.35fr_1fr]">
          <IntersectionFade className="relative hidden md:block">
            <DashboardPreview />
            <SkillChartCard />
          </IntersectionFade>

          <div>
            <IntersectionFade delay={100}>
              <SectionHeader
                eyebrow={content.eyebrow}
                title={content.title}
                subtitle={content.subtitle}
                light
              />
            </IntersectionFade>
            <div className="flex flex-col">
              {content.steps.map((s, i) => (
                <IntersectionFade key={s.title} delay={150 + i * 70}>
                  <div className="flex gap-5 border-b border-white/10 py-6 last:border-b-0">
                    <div className="min-w-[44px] font-heading text-[36px] font-extrabold leading-none text-yellow">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                      <p className="mt-[6px] text-[14px] leading-[1.65] text-white/55">{s.body}</p>
                    </div>
                  </div>
                </IntersectionFade>
              ))}
            </div>
            <IntersectionFade delay={400} className="mt-9">
              <Button href={bookingUrl} target="_blank">
                {content.ctaLabel}
              </Button>
            </IntersectionFade>
          </div>
        </div>
      </Container>
    </section>
  );
}

// Inline parent-dashboard preview. Replaces the static screenshot so the
// preview stays in sync with the real product and we can render it at a size
// where parents can actually read the cards.
function DashboardPreview() {
  const confidencePts = [
    { x: 20, y: 72 },
    { x: 80, y: 58 },
    { x: 140, y: 40 },
    { x: 200, y: 26 },
    { x: 260, y: 12 },
  ];
  const behaviours = [
    { label: "Participation", val: 8 },
    { label: "Focus", val: 8 },
    { label: "Homework", val: 6 },
  ];
  return (
    <div className="relative rounded-lg border border-white/10 bg-white shadow-[0_24px_60px_-20px_rgba(4,19,28,0.6)]">
      <div className="space-y-3 p-5">
        {/* Confidence chart */}
        <div className="rounded-md border border-navy/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-heading text-[13px] font-extrabold text-navy">
              Confidence over time
            </span>
            <span className="rounded-pill border-[1.5px] border-blue/40 bg-blue/10 px-2.5 py-0.5 font-heading text-[9px] font-bold uppercase tracking-wide text-blue">
              Confident
            </span>
          </div>
          <svg viewBox="0 0 280 88" className="w-full">
            <g stroke="#EEECEA" strokeWidth="0.6">
              {[18, 36, 54, 72].map((y) => (
                <line key={y} x1="0" y1={y} x2="280" y2={y} />
              ))}
            </g>
            <polyline
              points={confidencePts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#FF693F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {confidencePts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#FF693F" stroke="#fff" strokeWidth="1.5" />
            ))}
          </svg>
          <div className="mt-2 flex justify-between px-1 font-sans text-[9px] text-g400">
            <span>5 Dec</span>
            <span>9 Jan</span>
            <span>18 Feb</span>
            <span>20 Mar</span>
            <span>17 Apr</span>
          </div>
        </div>

        {/* Latest lesson with behaviour bars inline */}
        <div className="rounded-md bg-navy p-5 pr-[46%]">
          <span className="font-heading text-[9px] font-bold uppercase tracking-wider text-yellow">
            Latest lesson · 17 Apr
          </span>
          <h4 className="mt-2 font-heading text-[15px] font-extrabold leading-tight text-white">
            Fractions and mixed numbers
          </h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="font-heading text-[9px] font-bold uppercase tracking-wide text-white/55">
                Understanding
              </p>
              <span className="mt-1 inline-flex rounded-pill border border-blue/60 bg-blue/15 px-2 py-0.5 font-heading text-[9px] font-bold text-blue">
                Proficient
              </span>
            </div>
            <div>
              <p className="font-heading text-[9px] font-bold uppercase tracking-wide text-white/55">
                Confidence
              </p>
              <span className="mt-1 inline-flex rounded-pill border border-blue/60 bg-blue/15 px-2 py-0.5 font-heading text-[9px] font-bold text-blue">
                Confident
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
            {behaviours.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="flex-1 text-[10px] text-white/70">{b.label}</span>
                <span className="flex gap-[2px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-[3px] rounded-[1px] ${i < b.val ? "bg-yellow" : "bg-white/10"}`}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating secondary card — replaces the old child photo with a skill-growth
// mini chart so the composition still reads as "two product surfaces" without
// relying on a stock photo.
function SkillChartCard() {
  const pts = [
    { x: 12, y: 58 },
    { x: 48, y: 48 },
    { x: 84, y: 40 },
    { x: 120, y: 28 },
    { x: 152, y: 14 },
  ];
  return (
    <div className="absolute -bottom-10 -right-8 w-[42%] rounded-md border-4 border-navy bg-white p-4 shadow-[0_16px_32px_rgba(4,19,28,0.55)]">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[9px] font-bold uppercase tracking-wider text-g400">
          Skill level — Maths
        </span>
        <span className="font-heading text-[10px] font-bold text-navy">+92%</span>
      </div>
      <svg viewBox="0 0 170 76" className="mt-3 w-full">
        <defs>
          <linearGradient id="skill-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3EBEFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3EBEFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#EEECEA" strokeWidth="0.6">
          {[15, 30, 45, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="170" y2={y} />
          ))}
        </g>
        <path
          d={`M${pts.map((p) => `${p.x},${p.y}`).join(" L")} L ${pts.at(-1)!.x},76 L ${pts[0].x},76 Z`}
          fill="url(#skill-fill)"
        />
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#3EBEFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3EBEFF" stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between font-sans text-[9px]">
        <span className="text-g400">5 months</span>
        <span className="font-heading font-bold text-navy">4.2 → 8.1 / 10</span>
      </div>
    </div>
  );
}
