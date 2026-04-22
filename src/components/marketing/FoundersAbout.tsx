import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const founders = [
  {
    name: "Unyime Okorosobo",
    role: "Co-founder · Curriculum & Pedagogy",
    photo: "/founders/unyime-okorosobo.jpeg",
    bio: "Unyime holds a Master's in International Education from the University of Manchester and a B.Sc. in Computer Science from Bowen University. A third-generation educator with more than 15 years in classrooms and school leadership, she was named one of Nigeria's 50 Most Inspirational Teachers in 2023. She is a Microsoft Certified Educator, has trained thousands of teachers on classroom technology integration, and runs Strategic Maths — an initiative transforming how numeracy is taught across Nigerian schools.",
  },
  {
    name: "Grace Amoka",
    role: "Co-founder · Operations & Product",
    photo: "/founders/grace-amoka.png",
    bio: "Grace holds a degree in Computer Engineering from Covenant University and a Master's in Educational Technology from the University of Ilorin. With over nine years of experience as a teacher, coach, and education consultant, she has worked across K-12 systems on three continents, consulted for the World Bank, and served as a programme coordinator at the African Leadership Academy and Teach for Nigeria — training over 400 educators across more than seven countries.",
  },
];

export function FoundersAbout() {
  return (
    <section id="founders" className="bg-navy bg-dot-blue px-10 py-28">
      <Container>
        {/* Section intro */}
        <IntersectionFade className="mb-20 max-w-[760px]">
          <Eyebrow>About EduConnect</Eyebrow>
          <h2 className="mt-2 font-heading text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.08] text-white">
            Built on one belief:{" "}
            <span className="text-yellow">teaching quality determines everything.</span>
          </h2>
          <p className="mt-6 text-[17px] leading-[1.75] text-white/60">
            EduConnect was built on a simple belief: the quality of teaching determines
            everything. We recruit and vet Nigeria&apos;s most capable teachers, then work with
            families across Nigeria, the UK, the US, and Canada to give every child access to
            genuinely excellent instruction. We are a tutoring service — not a platform — and
            stay accountable for every teacher we place and every child we serve.
          </p>
          <p className="mt-7 inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow" />
            Backed by MIT
          </p>
        </IntersectionFade>

        {/* Founders — alternating large portrait + bio */}
        <div className="flex flex-col gap-20">
          {founders.map((f, i) => (
            <IntersectionFade
              key={f.name}
              delay={i * 120}
              className={`grid items-center gap-10 md:grid-cols-[5fr_6fr] md:gap-16 ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-blue/10 shadow-[0_24px_60px_-20px_rgba(4,19,28,0.6)]">
                <Image
                  src={f.photo}
                  alt={f.name}
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
          ))}
        </div>
      </Container>
    </section>
  );
}
