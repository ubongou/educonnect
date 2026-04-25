import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const BOOKING_URL = "https://calendar.app.google/ZiNbAvQkBaYHMVY69";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-yellow px-10 pt-2 bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] text-navy">
      <Container className="grid items-end gap-10 md:grid-cols-2 pb-0">
        <IntersectionFade className="pb-10">
          <Image
            src="/mit_badge.svg"
            alt="Backed by MIT — Massachusetts Institute of Technology"
            width={900}
            height={180}
            priority
            className="mb-5 h-[72px] w-auto"
          />

          <h1 className="font-heading text-[clamp(38px,5.2vw,62px)] font-extrabold leading-[1.05] text-navy">
            Personal Tutoring from Nigeria&apos;s Best Teachers
          </h1>
          <p className="mt-5 max-w-[480px] text-[18px] leading-[1.7] text-navy/70">
            EduConnect is a tutoring service that provides your children with private, one-on-one
            instruction from Nigeria&apos;s finest educators — rigorously vetted, carefully matched,
            and deeply invested in every child they teach.
          </p>
          <div className="mt-7 flex flex-wrap gap-[14px]">
            <Button href={BOOKING_URL} target="_blank" size="lg">
              Book a free session
            </Button>
            <Button href="#how-it-works" size="lg" variant="outline">
              How it works
            </Button>
          </div>
          <p className="mt-[12px] text-[13px] font-semibold text-navy/80">No commitment. Takes 15 minutes.</p>
        </IntersectionFade>

        <div className="relative hidden items-end justify-center md:flex">
          <div className="relative h-[580px] w-full max-w-[500px]">
            <Image
              src="/home/hero.png"
              alt="EduConnect student engaged in a one-on-one lesson"
              fill
              priority
              quality={95}
              sizes="(min-width: 768px) 420px, 100vw"
              className="object-contain object-bottom drop-shadow-[0_12px_24px_rgba(4,19,28,0.25)]"
            />
          </div>
          <span className="animate-float absolute left-[2%] top-[44%] z-20 rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap">
            Results beyond grades
          </span>
          <span
            className="animate-float absolute right-[2%] top-[44%] z-20 rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap"
            style={{ animationDelay: "1.5s" }}
          >
            Nigeria&apos;s finest teachers
          </span>
          <span
            className="animate-float absolute bottom-[8%] left-[2%] z-20 rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap"
            style={{ animationDelay: "0.8s" }}
          >
            Maths, English &amp; Science
          </span>
        </div>
      </Container>
    </section>
  );
}
