import { bundledAssets } from "@/lib/marketing/defaults";
import type { HowItWorksContent } from "@/lib/marketing/schemas";

export function HowItWorks({ content }: { content: HowItWorksContent }) {
  const dashboardImage = bundledAssets.dashboardImage;

  return (
    <section className="ddl" id="how" aria-labelledby="ddl-heading">
      <div className="container ddl-content">
        <div className="ddl-head reveal">
          <span className="eyebrow">{content.eyebrow}</span>
          <h2 id="ddl-heading">{content.title}</h2>
          <p>{content.subtitle}</p>
        </div>
        <div className="dashboard-wrapper reveal delay-1">
          <div className="ddl-dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dashboardImage}
              alt={content.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
