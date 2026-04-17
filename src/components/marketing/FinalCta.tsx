import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const BOOKING_URL = "https://calendar.app.google/ZiNbAvQkBaYHMVY69";

export function FinalCta() {
  return (
    <div className="relative overflow-hidden bg-yellow bg-dot-navy px-10 py-[104px] text-center">
      <div className="relative mx-auto max-w-[1100px]">
        <IntersectionFade>
          <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-extrabold text-navy">
            Ready to get started?
          </h2>
        </IntersectionFade>
        <IntersectionFade delay={120}>
          <p className="mt-4 text-[18px] text-navy/60">
            Book a free consultation and we&apos;ll find the right teacher for your child.
          </p>
        </IntersectionFade>
        <IntersectionFade delay={220} className="mt-9">
          <Button href={BOOKING_URL} target="_blank" size="lg">
            Book a free session
          </Button>
        </IntersectionFade>
        <IntersectionFade delay={300}>
          <p className="mt-[14px] text-[13px] text-navy/40">No commitment. Takes 15 minutes.</p>
        </IntersectionFade>
      </div>
    </div>
  );
}
