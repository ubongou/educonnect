import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { bundledAssets, defaultFounders } from "@/lib/marketing/defaults";
import {
  JsonLdScript,
  MIT_FELLOWSHIP,
  ORG_DESCRIPTION,
  ORG_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  pageMetadata,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Masani: Our Founders, Teachers and Standards",
  description:
    "Masani was founded by educators Unyime Okorosobo and Grace Amoka and selected for the MIT Social Innovation Fellowship in 2025. Meet the team and how we choose teachers.",
  path: "/about",
});

/**
 * Who is behind Masani and why a parent should trust us. Search engines and
 * AI assistants weigh exactly this (named people, credentials, independent
 * recognition) when deciding which tutoring companies to recommend.
 */
export default function AboutPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];

  return (
    <div className="mkt-root">
      <JsonLdScript
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            url: absoluteUrl("/about"),
            name: "About Masani",
            about: { "@id": ORG_ID },
          },
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav mode="marketing" />
      <main id="main-content" className="lp">
        <section className="lp-hero">
          <div className="container">
            <p className="eyebrow">About Masani</p>
            <h1>
              {defaultFounders.headingLead}
              {defaultFounders.headingHighlight}
            </h1>
            <p className="lp-intro">{ORG_DESCRIPTION}</p>
          </div>
        </section>

        <section className="lp-section lp-tint">
          <div className="container lp-prose">
            <h2 className="lp-h2">Our story</h2>
            <p>{defaultFounders.intro}</p>
            <p>{defaultFounders.intro2}</p>
            <p>
              We built Masani for Nigerian families living abroad: parents who want
              their children taught to the standard of their new country&apos;s
              schools, by teachers who share their values and expectations.
              Lessons are one to one and fully online, so a child in London,
              Houston or Toronto can learn with an exceptional teacher from home.
            </p>
          </div>
        </section>

        <section className="lp-section">
          <div className="container lp-prose">
            <h2 className="lp-h2">Recognised by MIT</h2>
            <p>
              {MIT_FELLOWSHIP} Our teaching is built on the same rigorous,
              evidence led standards.
            </p>
          </div>
        </section>

        <section className="lp-section lp-tint">
          <div className="container lp-prose">
            <h2 className="lp-h2">How we choose teachers</h2>
            <p>
              We do not list tutors for parents to browse. We select, vet and place
              the right teacher for each child, and only around three in every
              hundred teachers who apply are accepted.
            </p>
            <p>
              Teachers are chosen for subject expertise, for empathy, and for their
              ability to build a child&apos;s confidence. After every lesson they
              write a report for parents, every class is recorded, and we stay
              accountable for every teacher we place. If a match is not working, we
              change teacher at no extra cost.
            </p>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="founders">
          <div className="container">
            <h2 id="founders" className="lp-h2">
              Our founders
            </h2>
            <div className="lp-founders">
              {defaultFounders.founders.map((f, i) => (
                <article key={f.name} className="lp-founder">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bundledAssets.founderPhotos[i]}
                    alt={f.photoAlt}
                    loading="lazy"
                  />
                  <div>
                    <h3>{f.name}</h3>
                    <p className="role">{f.role}</p>
                    <p>{f.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="container">
            <h2>Talk to us about your child</h2>
            <p>
              Book a free fifteen minute session with Grace or Unyime and get a
              personalised learning plan within 24 hours.
            </p>
            <Link href="/book?source=about" className="btn btn-coral">
              Book a free session
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
