import Link from "next/link";
import "../../styles/landing.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { bundledAssets, defaultFounders } from "@/lib/marketing/defaults";
import { proofStats } from "@/lib/marketing/promise";
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
          <div className="container hb-hero-grid">
            <div>
              <h1>
                {defaultFounders.headingLead}
                <em>{defaultFounders.headingHighlight}</em>
              </h1>
              <p className="lp-intro">{ORG_DESCRIPTION}</p>
            </div>
            <div className="ab-founders-hero" aria-hidden="true">
              {defaultFounders.founders.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f.name} src={bundledAssets.founderPhotos[i]} alt="" />
              ))}
            </div>
          </div>
        </section>

        <section className="lx-proof" aria-label="Masani in numbers">
          <ul className="container">
            {proofStats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="lp-section">
          <div className="container ab-story">
            <div className="lp-prose">
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
            <figure className="ab-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gallery/photo-6.webp"
                alt="A teacher on a laptop screen leading a one to one online lesson"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section className="lx-dark" aria-labelledby="ab-mit">
          <div className="container ab-mit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-v2/mit-lockup-white.png" alt="MIT, Massachusetts Institute of Technology" loading="lazy" />
            <div>
              <h2 id="ab-mit" className="lp-h2">
                Recognised by MIT
              </h2>
              <p className="lx-dark-intro">
                {MIT_FELLOWSHIP} Our teaching is built on the same rigorous, evidence led
                standards.
              </p>
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="ab-teachers">
          <div className="container">
            <h2 id="ab-teachers" className="lp-h2">
              How we choose teachers
            </h2>
            <p className="lp-sub">
              We do not list tutors for parents to browse. We select, vet and place the
              right teacher for each child.
            </p>
            <ol className="lx-steps">
              <li>
                <h3>Only the top 3%</h3>
                <p>Of the teachers who apply, only the top 3% are accepted.</p>
              </li>
              <li>
                <h3>Chosen for the child</h3>
                <p>
                  Subject expertise, empathy and the ability to build a child&apos;s
                  confidence.
                </p>
              </li>
              <li>
                <h3>Accountable every lesson</h3>
                <p>A written report for parents after every lesson, and every class recorded.</p>
              </li>
              <li>
                <h3>Change any time</h3>
                <p>Families can change teacher at any time, free, no questions asked.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="lp-section lp-tint" aria-labelledby="founders">
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
              Book a free consultation
            </Link>
          </div>
        </section>
      </main>
      <Footer mode="marketing" />
    </div>
  );
}
