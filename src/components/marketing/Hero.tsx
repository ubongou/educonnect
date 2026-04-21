import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const BOOKING_URL = "https://calendar.app.google/ZiNbAvQkBaYHMVY69";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-yellow bg-dot-navy px-10 pt-[72px]">
      <Container className="grid items-end gap-16 md:grid-cols-2 pb-0">
        <IntersectionFade className="pb-20">
          <div className="mb-7 inline-flex items-center gap-3 rounded-lg bg-[#6B1A1A] py-[10px] pl-3 pr-4">
            <span className="font-heading text-[13px] font-bold text-yellow">Backed by</span>
            <div className="flex items-center gap-2 rounded-md bg-white px-[10px] py-[5px]">
              <div className="flex items-end gap-[3px]">
                <span className="block h-[14px] w-[4px] rounded-[1px] bg-navy" />
                <span className="block h-[14px] w-[4px] rounded-[1px] bg-navy" />
                <span className="block h-[8px] w-[4px] rounded-[1px] bg-navy" />
                <span className="block h-[14px] w-[4px] rounded-[1px] bg-navy" />
              </div>
              <div className="font-heading text-[10px] font-bold leading-tight text-navy">
                Massachusetts
                <br />
                Institute of
                <br />
                Technology
              </div>
            </div>
          </div>

          <h1 className="font-heading text-[clamp(34px,4.5vw,54px)] font-extrabold leading-[1.1] text-navy">
            Personal Tutoring from Nigeria&apos;s Best Teachers
          </h1>
          <p className="mt-5 max-w-[460px] text-[17px] leading-[1.72] text-navy/70">
            EduConnect is a tutoring service that provides your children with private, one-on-one
            instruction from Nigeria&apos;s finest educators — rigorously vetted, carefully matched,
            and deeply invested in every child they teach.
          </p>
          <div className="mt-8 flex flex-wrap gap-[14px]">
            <Button href={BOOKING_URL} target="_blank" size="lg">
              Book a free session
            </Button>
            <Button href="#how-it-works" size="lg" variant="outline">
              How it works
            </Button>
          </div>
          <p className="mt-[14px] text-[13px] text-navy/50">No commitment. Takes 15 minutes.</p>
        </IntersectionFade>

        <div className="relative hidden min-h-[440px] items-end justify-center md:flex">
          <span className="animate-float absolute left-0 top-[12%] rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap">
            Every child can excel
          </span>
          <span
            className="animate-float absolute right-0 top-[12%] rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap"
            style={{ animationDelay: "1.5s" }}
          >
            Nigeria&apos;s finest teachers
          </span>
          <span
            className="animate-float absolute bottom-[30%] left-[4%] rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap"
            style={{ animationDelay: "0.8s" }}
          >
            Maths, English &amp; Science
          </span>
          <div className="relative z-10 h-[480px] w-[340px] overflow-hidden rounded-t-[20px] shadow-[0_24px_60px_-18px_rgba(4,19,28,0.35)]">
            <Image
              src="/home/hero.jpg"
              alt="EduConnect student engaged in a one-on-one lesson"
              fill
              priority
              sizes="340px"
              className="object-cover object-top"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
