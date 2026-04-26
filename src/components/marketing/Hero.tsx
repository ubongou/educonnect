import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { resolveAssetUrl } from "@/lib/marketing/assetUrl";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { HeroContent } from "@/lib/marketing/schemas";

export function Hero({
  content,
  bookingUrl,
  updatedAt,
}: {
  content: HeroContent;
  bookingUrl: string;
  updatedAt: string | null;
}) {
  const heroImage = resolveAssetUrl(
    content.heroImagePath,
    bundledAssets.heroImage,
    updatedAt ?? undefined,
  );
  const mitBadge = resolveAssetUrl(
    content.mitBadgePath,
    bundledAssets.mitBadge,
    updatedAt ?? undefined,
  );

  return (
    <section className="relative overflow-hidden bg-yellow px-10 pt-2 bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] text-navy">
      <Container className="grid items-end gap-10 md:grid-cols-2 pb-0">
        <IntersectionFade className="pb-10">
          <Image
            src={mitBadge}
            alt={content.mitBadgeAlt}
            width={920}
            height={180}
            priority
            className="mb-5 h-[72px] w-auto"
          />

          <h1 className="font-heading text-[clamp(38px,5.2vw,62px)] font-extrabold leading-[1.05] text-navy">
            {content.heading}
          </h1>
          <p className="mt-5 max-w-[480px] text-[18px] leading-[1.7] text-navy/70">
            {content.subheading}
          </p>
          <div className="mt-7 flex flex-wrap gap-[14px]">
            <Button href={bookingUrl} target="_blank" size="lg">
              {content.primaryCtaLabel}
            </Button>
            <Button href="#how-it-works" size="lg" variant="outline">
              {content.secondaryCtaLabel}
            </Button>
          </div>
          <p className="mt-[12px] text-[13px] font-semibold text-navy/80">
            {content.disclaimer}
          </p>
        </IntersectionFade>

        <div className="relative hidden items-end justify-center md:flex">
          <div className="relative h-[580px] w-full max-w-[500px]">
            <Image
              src={heroImage}
              alt={content.heroImageAlt}
              fill
              priority
              quality={95}
              sizes="(min-width: 768px) 420px, 100vw"
              className="object-contain object-bottom drop-shadow-[0_12px_24px_rgba(4,19,28,0.25)]"
            />
          </div>
          <span className="animate-float absolute left-[14%] top-[44%] z-20 rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap">
            Results beyond grades
          </span>
          <span
            className="animate-float absolute right-[14%] top-[44%] z-20 rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap"
            style={{ animationDelay: "1.5s" }}
          >
            Nigeria&apos;s finest teachers
          </span>
          <span
            className="animate-float absolute bottom-[8%] left-[14%] z-20 rounded-md border-[1.5px] border-navy/15 bg-navy/10 px-4 py-[10px] font-heading text-[13px] font-bold text-navy whitespace-nowrap"
            style={{ animationDelay: "0.8s" }}
          >
            Maths, English &amp; Science
          </span>
        </div>
      </Container>
    </section>
  );
}
