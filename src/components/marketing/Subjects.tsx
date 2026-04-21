import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

type Subject = {
  name: string;
  tagline: string;
  blurb: string;
  icon: ReactNode;
};

const subjects: Subject[] = [
  {
    name: "Mathematics",
    tagline: "Number sense → Algebra",
    blurb:
      "From place value and arithmetic fluency to problem-solving, fractions, geometry, and early algebra — every session is paced to your child's current level.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8" y="6" width="32" height="36" rx="5" stroke="currentColor" strokeWidth="2.5" />
        <rect x="13" y="11" width="22" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="27" r="1.8" fill="currentColor" />
        <circle cx="24" cy="27" r="1.8" fill="currentColor" />
        <circle cx="31" cy="27" r="1.8" fill="currentColor" />
        <circle cx="17" cy="34" r="1.8" fill="currentColor" />
        <circle cx="24" cy="34" r="1.8" fill="currentColor" />
        <path d="M28 32 l6 6 M34 32 l-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "English",
    tagline: "Reading, writing, speaking",
    blurb:
      "Reading fluency and comprehension, vocabulary, grammar, sentence construction, spelling, writing clarity, and confident oral expression.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 10c6 0 12 2 18 6v26c-6-4-12-6-18-6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M42 10c-6 0-12 2-18 6v26c6-4 12-6 18-6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 16v26" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    name: "Sciences",
    tagline: "Concepts to application",
    blurb:
      "Core concept understanding, scientific reasoning, terminology, observations and experiments, and problem-solving in context.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M19 6v12L10 36a4 4 0 0 0 3.6 6h20.8A4 4 0 0 0 38 36L29 18V6" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="17" y1="6" x2="31" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="21" cy="32" r="2" fill="currentColor" />
        <circle cx="28" cy="28" r="1.5" fill="currentColor" />
        <circle cx="25" cy="37" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

export function Subjects() {
  return (
    <section id="subjects" className="bg-g50 px-10 py-24">
      <Container>
        <div className="grid items-end gap-10 md:grid-cols-[1.2fr_1fr]">
          <IntersectionFade>
            <SectionHeader
              eyebrow="What we teach"
              title={
                <>
                  Core subjects. <span className="text-blue">Deep focus.</span>
                </>
              }
              subtitle="We teach the three subjects that shape a child's academic confidence. Every lesson is one-on-one, matched to the learner's pace and goals."
              className="!mb-0"
            />
          </IntersectionFade>
          <IntersectionFade
            delay={120}
            className="flex flex-col items-start gap-4 md:items-end"
          >
            <span className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-navy bg-white px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-navy">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              Core curriculum
            </span>
            <p className="max-w-[320px] text-[14px] leading-[1.6] text-g600 md:text-right">
              British, Nigerian, and American curricula supported.
            </p>
          </IntersectionFade>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {subjects.map((s, i) => (
            <IntersectionFade key={s.name} delay={i * 120}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border-[1.5px] border-navy/10 bg-white p-8 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-navy/30 hover:shadow-[0_18px_44px_-18px_rgba(4,19,28,0.35)]">
                <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-yellow/30 blur-2xl transition-opacity duration-300 group-hover:bg-yellow/50" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-md bg-navy text-yellow">
                  <span className="h-7 w-7">{s.icon}</span>
                </div>
                <h3 className="relative mt-6 font-heading text-[22px] font-extrabold text-navy">
                  {s.name}
                </h3>
                <p className="relative mt-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-coral">
                  {s.tagline}
                </p>
                <p className="relative mt-4 text-[14px] leading-[1.7] text-g600">{s.blurb}</p>
              </article>
            </IntersectionFade>
          ))}
        </div>
      </Container>
    </section>
  );
}
