import Image from "next/image";
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
            {/* Shows the real parent dashboard so prospective parents see
                the end product — the IA they'll use, and the progress
                reporting they'll receive. Browser-chrome wrapper keeps the
                screenshot in context. */}
            <div className="relative rounded-lg border border-white/10 bg-white shadow-[0_24px_60px_-20px_rgba(4,19,28,0.6)]">
              <div className="flex items-center gap-2 border-b border-g100 bg-g50 px-4 py-[10px]">
                <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow" />
                <span className="h-2.5 w-2.5 rounded-full bg-blue" />
                <span className="ml-3 font-sans text-[12px] text-g600 truncate">
                  joineduconnect.com/dashboard
                </span>
              </div>
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-b-lg bg-white">
                <Image
                  src="/product/parent-overview.png"
                  alt="Parent dashboard showing the child tab, confidence and skill charts, latest lesson, and account status"
                  fill
                  sizes="(min-width: 768px) 520px, 100vw"
                  className="object-cover object-top"
                />
              </div>
            </div>
            {/* Floating photo accent keeps the section visually anchored
                to real humans rather than purely a product shot. */}
            <div className="absolute -bottom-7 -right-6 aspect-[4/5] w-[42%] overflow-hidden rounded-md border-4 border-navy bg-yellow">
              <Image
                src="/gallery/photo-4.webp"
                alt="EduConnect student engaged during a lesson"
                fill
                sizes="(min-width: 768px) 220px, 40vw"
                className="object-cover object-top"
              />
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
