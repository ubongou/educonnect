import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const quotes = [
  {
    body:
      "The tutors have been outstanding — patient, professional, and deeply committed. I would wholeheartedly recommend EduConnect to any parent looking to see tangible improvement in their children's learning journey.",
    author: "Andrew Ugbehe — Scotland, UK",
  },
  {
    body:
      "Since I started using this service, my child's performance has improved. The lesson teacher is good at what she does, and I have recommended their services to other parents and will continue to do so.",
    author: "Mrs. Frilster — United Kingdom",
  },
  {
    body:
      "Our daughter gets excited to connect with her EduConnect tutor. Her attitude toward learning mathematics has changed completely. Her self-confidence has increased and she is eager to learn new concepts.",
    author: "Mrs. Joanne — United States",
  },
];

export function Testimonials() {
  return (
    <section className="relative bg-blue bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] px-10 py-24">
      <Container>
        <IntersectionFade>
          <SectionHeader eyebrow="What parents say" title="Real results, real families" />
        </IntersectionFade>
        <div className="grid gap-5 md:grid-cols-3">
          {quotes.map((q, i) => (
            <IntersectionFade key={q.author} delay={i * 120}>
              <Card className="hover:-translate-y-[3px]">
                <span className="mb-4 block font-heading text-[64px] font-extrabold leading-[0.8] text-yellow">
                  &ldquo;
                </span>
                <p className="mb-5 text-[14px] italic leading-[1.78] text-g600">{q.body}</p>
                <span className="text-[13px] font-bold text-navy">{q.author}</span>
              </Card>
            </IntersectionFade>
          ))}
        </div>
      </Container>
    </section>
  );
}
