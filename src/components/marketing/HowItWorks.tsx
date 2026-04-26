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
    <section id="how-it-works" className="bg-navy px-6 py-24 md:px-10">
      <Container>
        <IntersectionFade className="mx-auto max-w-[760px] text-center">
          <SectionHeader
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            light
            align="center"
          />
        </IntersectionFade>

        <IntersectionFade delay={120} className="mt-10">
          <DashboardPreview />
        </IntersectionFade>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {content.steps.map((s, i) => (
            <IntersectionFade key={s.title} delay={150 + i * 70}>
              <div className="h-full rounded-lg border border-white/10 bg-white/[0.03] p-7">
                <p className="font-heading text-[36px] font-extrabold leading-none text-yellow">
                  {i + 1}
                </p>
                <h3 className="mt-5 font-heading text-base font-bold text-white">
                  {s.title}
                </h3>
                <p className="mt-[6px] text-[14px] leading-[1.65] text-white/55">
                  {s.body}
                </p>
              </div>
            </IntersectionFade>
          ))}
        </div>

        <IntersectionFade delay={400} className="mt-12 text-center">
          <Button href={bookingUrl} target="_blank" size="lg">
            {content.ctaLabel}
          </Button>
        </IntersectionFade>
      </Container>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Inline parent-dashboard preview. Goes full-width inside the section so
// parents can read it without squinting. Mirrors the real product surface
// (overview + confidence + skill progression + latest lesson + behaviours)
// so the marketing claim "this is what you get after sign-up" lands.
// -----------------------------------------------------------------------------

function DashboardPreview() {
  return (
    <div className="mx-auto max-w-[1100px] overflow-hidden rounded-xl border border-white/10 bg-g50 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      {/* Page body */}
      <div className="bg-g50 p-5 md:p-7">
        <p className="font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-blue">
          Parent dashboard
        </p>
        <h3 className="mt-1 font-heading text-[22px] font-extrabold leading-tight text-navy">
          Overview
        </h3>
        <p className="mt-1 font-sans text-[11px] text-g600">
          Progress snapshot for Temi.
        </p>

        <div className="mt-4">
          <ChildTabs />
        </div>
        <div className="mt-4 space-y-3">
          <ConfidenceCard />
          <SkillCard />
          <div className="grid gap-3 md:grid-cols-2">
            <LatestLessonCard />
            <BehavioursCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildTabs() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-pill bg-navy px-3 py-1.5 font-heading text-[11px] font-bold text-yellow">
        <span className="h-2 w-2 rounded-full bg-yellow" />
        Temi Coker · Year 7
      </span>
      <span className="inline-flex items-center gap-2 rounded-pill border border-navy/15 bg-white px-3 py-1.5 font-heading text-[11px] font-bold text-navy">
        <span className="h-2 w-2 rounded-full bg-blue" />
        Kolade Coker · Year 4
      </span>
    </div>
  );
}

function ConfidenceCard() {
  // 7 monthly points climbing through the named confidence levels.
  // y axis: 0 = top (Exceptional), 6 = bottom (Withdrawn) on a 90-unit canvas.
  const pts = [
    { x: 30, y: 70, label: "Dec 5" },
    { x: 200, y: 60, label: "Jan 9" },
    { x: 380, y: 50, label: "Feb 6" },
    { x: 540, y: 38, label: "Mar 6" },
    { x: 720, y: 22, label: "Mar 20" },
    { x: 900, y: 18, label: "Apr 17" },
  ];
  const levels = ["Exceptional", "Confident", "Assured", "Developing", "Hesitant", "Withdrawn"];

  return (
    <div className="rounded-md border border-navy/10 bg-white p-4">
      <p className="mb-3 font-heading text-[12px] font-extrabold text-navy">
        Confidence progression
      </p>
      <div className="flex">
        <div className="flex flex-col justify-between pr-3 font-sans text-[9px] text-g400">
          {levels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="flex-1">
          <svg viewBox="0 0 980 90" className="w-full">
            <g stroke="#EEF1F4" strokeWidth="0.6">
              {[15, 30, 45, 60, 75].map((y) => (
                <line key={y} x1="0" y1={y} x2="980" y2={y} />
              ))}
            </g>
            <polyline
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#FCB936"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#FCB936"
                stroke="#fff"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <div className="mt-1 flex justify-between font-sans text-[9px] text-g400">
            {pts.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillCard() {
  const pts = [
    { x: 30, y: 60 },
    { x: 180, y: 56 },
    { x: 330, y: 50 },
    { x: 480, y: 44 },
    { x: 630, y: 36 },
    { x: 780, y: 24 },
    { x: 930, y: 18 },
  ];

  return (
    <div className="rounded-md border border-navy/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-[12px] font-extrabold text-navy">
          Skill progression
        </p>
        <div className="flex gap-1">
          <span className="rounded-pill bg-navy px-2.5 py-1 font-heading text-[10px] font-bold text-yellow">
            Maths
          </span>
          <span className="rounded-pill border border-navy/15 bg-white px-2.5 py-1 font-heading text-[10px] font-bold text-navy">
            English
          </span>
          <span className="rounded-pill border border-navy/15 bg-white px-2.5 py-1 font-heading text-[10px] font-bold text-navy">
            Science
          </span>
        </div>
      </div>
      <div className="flex">
        <div className="flex flex-col justify-between pr-3 font-sans text-[9px] text-g400">
          <span>10</span>
          <span>5</span>
          <span>1</span>
        </div>
        <svg viewBox="0 0 980 70" className="w-full">
          <defs>
            <linearGradient id="skill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3EBEFF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3EBEFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="#EEF1F4" strokeWidth="0.6">
            {[14, 28, 42, 56].map((y) => (
              <line key={y} x1="0" y1={y} x2="980" y2={y} />
            ))}
          </g>
          <path
            d={`M${pts.map((p) => `${p.x},${p.y}`).join(" L")} L ${pts.at(-1)!.x},70 L ${pts[0].x},70 Z`}
            fill="url(#skill-grad)"
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
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#3EBEFF"
              stroke="#fff"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function LatestLessonCard() {
  return (
    <div className="rounded-md border border-navy/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-[12px] font-extrabold text-navy">
          Latest lesson
        </p>
        <span className="font-sans text-[10px] text-g400">17 Apr 2026</span>
      </div>
      <div className="rounded-md bg-navy px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-[12px] font-extrabold text-yellow">
            Temi Coker
          </span>
          <span className="font-sans text-[10px] text-white/60">Ms. Ayobola</span>
        </div>
        <p className="font-sans text-[10px] text-white/50">Maths</p>
      </div>
      <Row label="Focus" value="Fractions and mixed numbers" />
      <Row label="Confidence" pill="Confident" />
      <Row label="Next session" value="Tue 22 Apr · 4:00 PM" />
      <Row label="Help at home" value="Fraction worksheets daily" />
    </div>
  );
}

function Row({
  label,
  value,
  pill,
}: {
  label: string;
  value?: string;
  pill?: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-g100 py-2 font-sans text-[11px] last:border-b last:pb-2 first:border-t-0 first:pt-2">
      <span className="text-g600">{label}</span>
      {pill ? (
        <span className="rounded-pill border border-blue/30 bg-blue/10 px-2 py-0.5 font-heading text-[10px] font-bold text-blue">
          {pill}
        </span>
      ) : (
        <span className="text-navy">{value}</span>
      )}
    </div>
  );
}

function BehavioursCard() {
  const items = [
    { label: "Participation", val: 8 },
    { label: "Focus and attention", val: 8 },
    { label: "Homework completion", val: 6 },
  ];
  return (
    <div className="rounded-md border border-navy/10 bg-white p-4">
      <p className="mb-3 font-heading text-[12px] font-extrabold text-navy">
        Learning behaviours
      </p>
      {items.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-3 border-t border-g100 py-2 first:border-t-0 first:pt-0"
        >
          <span className="flex-1 font-sans text-[11px] text-g600">{b.label}</span>
          <span className="flex gap-[3px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={`h-3 w-[5px] rounded-[1px] ${i < b.val ? "bg-yellow" : "bg-g100"}`}
              />
            ))}
          </span>
          <span className="w-8 text-right font-heading text-[10px] font-bold text-navy tabular-nums">
            {b.val}/10
          </span>
        </div>
      ))}
      <div className="mt-3 border-t border-g100 pt-3">
        <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-g400">
          Teacher note
        </p>
        <p className="mt-1 font-sans text-[11px] italic leading-[1.5] text-navy/70">
          &ldquo;Temi showed great improvement this week. Her confidence with
          fractions is noticeably stronger.&rdquo;
        </p>
      </div>
    </div>
  );
}
