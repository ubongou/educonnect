import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const BOOKING_URL = "https://calendar.app.google/ZiNbAvQkBaYHMVY69";

const steps = [
  {
    title: "Book a free consultation",
    body: "Tell us your child's year group, subjects, and goals. Takes 15 minutes.",
  },
  {
    title: "We match your teacher",
    body: "We select a teacher based on your child's needs, learning style, and personality — not just availability.",
  },
  {
    title: "Sessions begin",
    body: "Flexible scheduling, one-on-one, fully online. Lessons adapt as your child grows.",
  },
  {
    title: "Results and updates",
    body: "Better grades, stronger confidence, and a changed attitude toward learning. You receive regular progress updates throughout.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-navy px-10 py-24">
      <Container>
        <div className="grid items-start gap-[72px] md:grid-cols-2">
          <IntersectionFade className="relative hidden md:block">
            <div className="flex aspect-[3/4] max-h-[520px] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
              <p className="p-3 text-center text-[11px] font-medium text-white/30">
                Add image here — online session in progress
              </p>
            </div>
            <div className="absolute -bottom-5 -right-5 flex aspect-[4/3] w-[55%] items-center justify-center overflow-hidden rounded-md border-4 border-navy bg-yellow">
              <p className="p-3 text-center text-[11px] font-medium text-navy/45">
                Add image — student
              </p>
            </div>
          </IntersectionFade>

          <div>
            <IntersectionFade delay={100}>
              <SectionHeader
                eyebrow="How it works"
                title="Four steps to better results"
                subtitle="From your first conversation to visible progress at school — here is what to expect."
                light
              />
            </IntersectionFade>
            <div className="flex flex-col">
              {steps.map((s, i) => (
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
              <Button href={BOOKING_URL} target="_blank">
                Book a free session
              </Button>
            </IntersectionFade>
          </div>
        </div>
      </Container>
    </section>
  );
}
