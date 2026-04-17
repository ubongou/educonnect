import { Container } from "@/components/ui/Container";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

export function IntroStrip() {
  return (
    <section className="bg-navy px-10">
      <Container className="!px-0">
        <div className="grid items-stretch md:grid-cols-2">
          <IntersectionFade className="border-b border-white/10 py-14 md:border-b-0 md:border-r md:pr-14">
            <div className="relative">
              <span className="block font-heading text-[80px] leading-[0.6] text-yellow">
                &ldquo;
              </span>
              <p className="mt-3 font-heading text-[clamp(22px,2.8vw,30px)] font-extrabold leading-[1.3] text-white">
                The right teacher doesn&apos;t just improve a grade. They change how a child sees
                themselves.
              </p>
            </div>
          </IntersectionFade>

          <IntersectionFade delay={120} className="flex flex-col justify-center gap-5 py-14 md:pl-14">
            <div className="flex items-start gap-4">
              <span className="min-w-[60px] font-heading text-[36px] font-extrabold leading-none text-yellow">
                200+
              </span>
              <p className="pt-[6px] text-[14px] leading-[1.65] text-white/55">
                Children across Nigeria, the UK, the US, and Canada have experienced what the right
                teacher can do.
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-start gap-4">
              <span className="min-w-[60px] font-heading text-[36px] font-extrabold leading-none text-yellow">
                4.9
              </span>
              <p className="pt-[6px] text-[14px] leading-[1.65] text-white/55">
                Average satisfaction rating from parents — who consistently tell us the change is
                visible inside and outside the classroom.
              </p>
            </div>
          </IntersectionFade>
        </div>
      </Container>
    </section>
  );
}
