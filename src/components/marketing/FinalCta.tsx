import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import type { FinalCtaContent } from "@/lib/marketing/schemas";

export function FinalCta({
  content,
  bookingUrl,
}: {
  content: FinalCtaContent;
  bookingUrl: string;
}) {
  return (
    <div className="relative overflow-hidden bg-yellow bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] px-10 py-[104px] text-center">
      <div className="relative mx-auto max-w-[1280px]">
        <IntersectionFade>
          <h2 className="font-heading text-[clamp(28px,4vw,48px)] font-extrabold text-navy">
            {content.heading}
          </h2>
        </IntersectionFade>
        <IntersectionFade delay={120}>
          <p className="mt-4 text-[18px] text-navy/60">{content.subheading}</p>
        </IntersectionFade>
        <IntersectionFade delay={220} className="mt-9">
          <Button href={bookingUrl} target="_blank" size="lg">
            {content.ctaLabel}
          </Button>
        </IntersectionFade>
        <IntersectionFade delay={300}>
          <p className="mt-[14px] text-[13px] font-semibold text-navy/80">
            {content.disclaimer}
          </p>
        </IntersectionFade>
      </div>
    </div>
  );
}
