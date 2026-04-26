import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import type { TestimonialsContent } from "@/lib/marketing/schemas";

export function Testimonials({ content }: { content: TestimonialsContent }) {
  return (
    <section className="relative bg-blue bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] px-10 py-24">
      <Container>
        <IntersectionFade>
          <SectionHeader eyebrow={content.eyebrow} title={content.title} />
        </IntersectionFade>
        <div className="grid gap-5 md:grid-cols-3">
          {content.quotes.map((q, i) => (
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
