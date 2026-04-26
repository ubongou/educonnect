import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { resolveAssetUrl } from "@/lib/marketing/assetUrl";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { FoundersContent } from "@/lib/marketing/schemas";

export function FoundersAbout({
  content,
  updatedAt,
}: {
  content: FoundersContent;
  updatedAt: string | null;
}) {
  return (
    <section id="founders" className="bg-navy bg-dot-blue px-10 py-28">
      <Container>
        {/* Section intro */}
        <IntersectionFade className="mb-20">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-2 font-heading text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.08] text-white">
            {content.headingLead}
            <span className="text-yellow">{content.headingHighlight}</span>
          </h2>
          <p className="mt-6 text-[17px] leading-[1.75] text-white/60">
            {content.intro}
          </p>
        </IntersectionFade>

        {/* Founders — alternating large portrait + bio */}
        <div className="flex flex-col gap-20">
          {content.founders.map((f, i) => {
            const photoSrc = resolveAssetUrl(
              f.photoPath,
              bundledAssets.founderPhotos[i] ?? bundledAssets.founderPhotos[0],
              updatedAt ?? undefined,
            );
            return (
              <IntersectionFade
                key={f.name}
                delay={i * 120}
                className={`grid items-center gap-10 md:grid-cols-[5fr_6fr] md:gap-16 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-blue/10 shadow-[0_24px_60px_-20px_rgba(4,19,28,0.6)]">
                  <Image
                    src={photoSrc}
                    alt={f.photoAlt}
                    fill
                    sizes="(min-width: 768px) 480px, 100vw"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/40 to-transparent" />
                </div>

                <div>
                  <p className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-yellow">
                    {f.role}
                  </p>
                  <h3 className="font-heading text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.05] text-white">
                    {f.name}
                  </h3>
                  <p className="mt-6 text-[16px] leading-[1.8] text-white/65">{f.bio}</p>
                </div>
              </IntersectionFade>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
