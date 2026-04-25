"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntersectionFade } from "@/components/ui/IntersectionFade";
import { Button } from "@/components/ui/Button";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    // MVP stub — POST to a server route once the email provider is wired.
    await new Promise((r) => setTimeout(r, 400));
    console.info("contact form submitted:", Object.fromEntries(form.entries()));
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <section id="contact" className="bg-navy px-10 py-24">
      <Container>
        <div className="grid items-start gap-[72px] md:grid-cols-[1fr_1.4fr]">
          <IntersectionFade>
            <Eyebrow>Get in touch</Eyebrow>
            <h2 className="mb-4 font-heading text-[clamp(26px,3.5vw,40px)] font-extrabold leading-[1.15] text-white">
              Let&apos;s talk
            </h2>
            <p className="mb-7 text-[15px] leading-[1.75] text-white/55">
              Have questions before booking? Send us a message and we&apos;ll get back to you
              within 24 hours.
            </p>
            <div className="mb-2 flex items-center gap-[10px] text-[14px] text-white/55">
              <span>✉</span>
              <a href="mailto:admin@joineduconnect.com" className="text-blue">
                admin@joineduconnect.com
              </a>
            </div>
            <div className="flex items-center gap-[10px] text-[14px] text-white/55">
              <span>🌐</span>
              <a href="https://www.joineduconnect.com" className="text-blue">
                joineduconnect.com
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-[10px]">
              <a
                href="https://www.instagram.com/educonnectng/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-white/15 px-[18px] py-[10px] text-[13px] font-semibold text-white/70 transition-colors hover:border-white/50 hover:bg-white/5 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
                </svg>
                Instagram
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61572098883786"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-white/15 px-[18px] py-[10px] text-[13px] font-semibold text-white/70 transition-colors hover:border-white/50 hover:bg-white/5 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                Facebook
              </a>
            </div>
          </IntersectionFade>

          <IntersectionFade delay={150}>
            {submitted ? (
              <div className="rounded-md border border-blue/25 bg-blue/5 p-6 text-center text-[15px] font-semibold text-blue">
                Message sent! We&apos;ll be in touch within 24 hours.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
                <div className="grid gap-[14px] md:grid-cols-2">
                  <div className="flex flex-col gap-[7px]">
                    <label className="font-heading text-[13px] font-semibold text-white/55">
                      Your name
                    </label>
                    <input
                      name="name"
                      type="text"
                      placeholder="e.g. Adaeze Obi"
                      required
                      className="rounded-md border-[1.5px] border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    <label className="font-heading text-[13px] font-semibold text-white/55">
                      Email address
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="rounded-md border-[1.5px] border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="font-heading text-[13px] font-semibold text-white/55">Subject</label>
                  <select
                    name="subject"
                    className="rounded-md border-[1.5px] border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white focus:border-blue focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    <option>Maths</option>
                    <option>English</option>
                    <option>Science</option>
                    <option>Multiple subjects</option>
                    <option>General enquiry</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="font-heading text-[13px] font-semibold text-white/55">Message</label>
                  <textarea
                    name="message"
                    placeholder="Tell us about your child and what support you're looking for..."
                    className="min-h-[110px] resize-y rounded-md border-[1.5px] border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="self-start">
                  {submitting ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </IntersectionFade>
        </div>
      </Container>
    </section>
  );
}
