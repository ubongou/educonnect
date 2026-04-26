import type { ReactNode } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { resolveAssetUrl } from "@/lib/marketing/assetUrl";
import { bundledAssets } from "@/lib/marketing/defaults";
import type { WhyGridContent } from "@/lib/marketing/schemas";

// Card iconography stays in code — out of MVP scope, and the SVGs are
// tightly tuned to the navy/yellow palette. Position in this array maps
// 1:1 with content.cards[index].
const cardIcons: ReactNode[] = [
  <svg key="0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="8" y="10" width="32" height="22" rx="3" stroke="white" strokeWidth="2.5" />
    <rect x="14" y="32" width="20" height="4" rx="1" stroke="white" strokeWidth="2" />
    <circle cx="24" cy="21" r="5" stroke="white" strokeWidth="2.5" />
    <line x1="10" y1="44" x2="38" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>,
  <svg key="1" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="14" r="6" stroke="white" strokeWidth="2.5" />
    <path
      d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="36" cy="20" r="4" stroke="white" strokeWidth="2" />
    <path d="M40 34c0-5-2.686-8-4-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>,
  <svg key="2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polyline
      points="8,34 18,22 26,28 38,12"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <polyline
      points="32,12 38,12 38,18"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>,
];

const polaroidTilts = ["-rotate-[1.5deg]", "rotate-[1deg]", "-rotate-[1deg]"] as const;

export function WhyGrid({
  content,
  updatedAt,
}: {
  content: WhyGridContent;
  updatedAt: string | null;
}) {
  return (
    <section
      id="why"
      className="relative bg-blue bg-[url('/hero-doodles.svg')] bg-repeat [background-size:480px_480px] px-10 py-24"
    >
      <Container>
        <IntersectionFade>
          <SectionHeader
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
          />
        </IntersectionFade>
        <div className="grid gap-5 md:grid-cols-3">
          {content.cards.map((card, i) => (
            <IntersectionFade key={card.title} delay={i * 120}>
              <Card variant="dark-yellow-border" className="hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(4,19,28,0.3)]">
                <div className="mb-6 flex items-start justify-between">
                  <h3 className="max-w-[160px] font-heading text-base font-extrabold leading-[1.3] text-yellow">
                    {card.title}
                  </h3>
                  <div className="h-12 w-12 shrink-0 opacity-90">{cardIcons[i]}</div>
                </div>
                <p className="text-[14px] leading-[1.72] text-white/70">{card.body}</p>
              </Card>
            </IntersectionFade>
          ))}
        </div>

        <IntersectionFade delay={150} className="mt-10">
          <div className="grid gap-5 md:grid-cols-3">
            {content.polaroids.map((polaroid, i) => {
              const src = resolveAssetUrl(
                polaroid.imagePath,
                bundledAssets.whyGridPolaroids[i] ?? bundledAssets.whyGridPolaroids[0],
                updatedAt ?? undefined,
              );
              return (
                <div
                  key={i}
                  className={`relative aspect-[4/5] overflow-hidden rounded-lg border-[6px] border-white bg-white shadow-[0_12px_30px_-8px_rgba(4,19,28,0.35)] transition-transform duration-300 hover:rotate-0 ${polaroidTilts[i]}`}
                >
                  <Image
                    src={src}
                    alt={polaroid.alt}
                    fill
                    sizes="(min-width: 768px) 380px, 100vw"
                    className="object-cover object-top"
                  />
                </div>
              );
            })}
          </div>
        </IntersectionFade>
      </Container>
    </section>
  );
}
