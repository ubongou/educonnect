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
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow reveal">{content.eyebrow}</span>
          <h1 className="reveal delay-1">
            {content.headingPart1}
            {content.headingAccent && (
              <span className="accent">{content.headingAccent}</span>
            )}
            {content.headingPart2}
          </h1>
          <p className="lead reveal delay-2">{content.subheading}</p>
          <div className="hero-ctas reveal delay-3">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-coral"
            >
              {content.primaryCtaLabel}{" "}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a href="/pricing" className="btn btn-ghost">
              {content.secondaryCtaLabel}
            </a>
          </div>
          <div className="hero-microcopy reveal delay-3">
            <span className="dot" aria-hidden="true" /> {content.microcopy}
          </div>
        </div>

        <div className="hero-visual reveal delay-2">
          <div className="mit-banner">
            <div className="mit-pill">
              <span className="backed">Backed by</span>
              <span className="sep" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mitBadge}
                alt={content.mitBadgeAlt}
                width={120}
                height={46}
              />
            </div>
          </div>
          <div className="hero-photo-shell">
            <div className="hero-photo" aria-hidden="true">
              <span className="blob-y" />
              <span className="blob-c" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt={content.heroImageAlt} />
            </div>
            <div className="hero-card c1" aria-hidden="true">
              <div className="tick-icon" aria-hidden="true">
                ★
              </div>
              <div className="label">
                <strong>{content.card1Title}</strong>
                {content.card1Body}
              </div>
            </div>
            <div className="hero-card c2" aria-hidden="true">
              <div className="avatar-stack" aria-hidden="true">
                <span className="a1">A</span>
                <span className="a2">M</span>
                <span className="a3">J</span>
                <span className="a4">+</span>
              </div>
              <div className="label">
                <strong>{content.card2Title}</strong>
                {content.card2Body}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
