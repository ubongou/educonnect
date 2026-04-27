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
    <section className="about" id="about" aria-labelledby="about-heading">
      <div className="container">
        <div className="about-intro">
          <div className="reveal">
            <span className="eyebrow" style={{ marginBottom: 18 }}>
              {content.eyebrow}
            </span>
            <h2 id="about-heading" style={{ marginTop: 14 }}>
              {content.headingLead}
              <em>{content.headingHighlight}</em>
            </h2>
            <p>{content.intro}</p>
            {content.intro2 && <p>{content.intro2}</p>}
          </div>
        </div>

        <div className="founders">
          {content.founders.map((f, i) => {
            const photo = resolveAssetUrl(
              f.photoPath,
              bundledAssets.founderPhotos[i] ?? bundledAssets.founderPhotos[0],
              updatedAt ?? undefined,
            );
            return (
              <article
                key={i}
                className={`founder reveal${i > 0 ? ` delay-${i}` : ""}`}
              >
                <div className="founder-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={f.photoAlt}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="tag" aria-hidden="true">
                    {f.role}
                  </span>
                </div>
                <div className="founder-body">
                  <h3>{f.name}</h3>
                  <p>{f.bio}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
