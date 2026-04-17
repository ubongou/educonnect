import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

type Item = { title: string; body: string; icon: ReactNode };

const items: Item[] = [
  {
    title: "Exceptional Teachers",
    body: "Learn from passionate educators who bring out the best in every student. Our teachers are carefully selected for their expertise, empathy, and ability to inspire confidence in learners.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8" y="10" width="32" height="22" rx="3" stroke="white" strokeWidth="2.5" />
        <rect x="14" y="32" width="20" height="4" rx="1" stroke="white" strokeWidth="2" />
        <circle cx="24" cy="21" r="5" stroke="white" strokeWidth="2.5" />
        <line x1="10" y1="44" x2="38" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Flexible, Child-Centered Learning",
    body: "We work around your schedule, not the other way around. Choose the times, formats, and goals that suit your child's needs — all while staying informed and involved every step of the way.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="24" cy="14" r="6" stroke="white" strokeWidth="2.5" />
        <path
          d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="36" cy="20" r="4" stroke="white" strokeWidth="2" />
        <path d="M40 34c0-5-2.686-8-4-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Academic and Personal Growth",
    body: "Our approach goes beyond test scores. We help students build confidence, resilience, and a genuine love for learning. Every session is a step toward becoming a more capable, self-assured learner.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polyline
          points="8,34 18,22 26,28 38,12"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <polyline
          points="32,12 38,12 38,18"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
];

export function WhyGrid() {
  return (
    <section id="why" className="px-10 py-24">
      <Container>
        <IntersectionFade>
          <SectionHeader
            eyebrow="Why EduConnect"
            title="What sets our teachers apart"
            subtitle="We do not list tutors for parents to browse. We select, vet, and place the right teacher for each child."
          />
        </IntersectionFade>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <IntersectionFade key={it.title} delay={i * 120}>
              <Card variant="dark-yellow-border" className="hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(4,19,28,0.3)]">
                <div className="mb-6 flex items-start justify-between">
                  <h3 className="max-w-[160px] font-heading text-base font-extrabold leading-[1.3] text-yellow">
                    {it.title}
                  </h3>
                  <div className="h-12 w-12 shrink-0 opacity-90">{it.icon}</div>
                </div>
                <p className="text-[14px] leading-[1.72] text-white/70">{it.body}</p>
              </Card>
            </IntersectionFade>
          ))}
        </div>

        <IntersectionFade delay={150} className="mt-7">
          <div className="grid h-[300px] grid-cols-1 overflow-hidden rounded-lg md:grid-cols-[3fr_2fr]">
            <div className="flex items-center justify-center bg-g100">
              <p className="p-3 text-[12px] font-medium text-g400 text-center">
                Add image here — students in a session
              </p>
            </div>
            <div className="hidden flex-col md:flex">
              <div className="flex flex-1 items-center justify-center border-l-4 border-b-4 border-white bg-g50">
                <p className="p-3 text-[11px] font-medium text-g400">Add image — teacher</p>
              </div>
              <div className="flex flex-1 items-center justify-center border-l-4 border-white bg-navy">
                <p className="p-3 text-[11px] font-medium text-white/30">Add image — student</p>
              </div>
            </div>
          </div>
        </IntersectionFade>
      </Container>
    </section>
  );
}
