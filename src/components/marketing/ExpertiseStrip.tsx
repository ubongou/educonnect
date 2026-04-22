import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

// Order matters: the strip duplicates this list for a seamless loop, so
// visually similar compositions (top-down laptop views) are split apart to
// reduce the "same image twice" feel. photo-5 was near-duplicate of
// photo-6 (both top-down laptop frames) so we drop it from the set.
const photos = [
  { src: "/gallery/photo-1.webp", alt: "Student listening on headphones during a lesson" },
  { src: "/gallery/photo-3.webp", alt: "Student writing in a notebook beside open reading" },
  { src: "/gallery/photo-6.webp", alt: "Student on a live video lesson with a teacher" },
  { src: "/gallery/photo-4.webp", alt: "Student raising a hand, engaged mid-class" },
  { src: "/gallery/photo-2.webp", alt: "Student working through practice problems" },
];

export function ExpertiseStrip() {
  // Duplicate for a seamless CSS-wrapped loop.
  const loop = [...photos, ...photos];

  return (
    <section className="overflow-hidden bg-navy bg-dot-blue py-20">
      <Container>
        <IntersectionFade className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Our expertise</Eyebrow>
            <h2 className="mt-2 font-heading text-[clamp(28px,3.6vw,42px)] font-extrabold leading-[1.08] text-white">
              Nigeria&apos;s finest teachers,{" "}
              <span className="text-yellow">already in the room.</span>
            </h2>
          </div>
          <p className="max-w-[360px] text-[15px] leading-[1.7] text-white/60">
            A rotating glimpse of the tutors and students working together across the EduConnect
            network.
          </p>
        </IntersectionFade>
      </Container>

      <div
        aria-hidden="true"
        className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="expertise-track flex min-w-max items-stretch gap-5 px-10">
          {loop.map((p, i) => (
            <div
              key={i}
              className="relative h-[320px] w-[240px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.6)]"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="240px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/70 to-transparent" />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes expertiseSlide {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .expertise-track {
            animation: expertiseSlide 60s linear infinite;
            will-change: transform;
          }
          @media (prefers-reduced-motion: reduce) {
            .expertise-track { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}
