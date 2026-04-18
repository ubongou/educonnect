import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntersectionFade } from "@/components/ui/IntersectionFade";

const founders = [
  {
    name: "Unyime Okorosobo",
    photo: "/founders/unyime-okorosobo.jpeg",
    bio: "Unyime holds a Master's in International Education from the University of Manchester and a B.Sc. in Computer Science from Bowen University. A third-generation educator with more than 15 years in classrooms and school leadership, she was named one of Nigeria's 50 Most Inspirational Teachers in 2023. She is a Microsoft Certified Educator, has trained thousands of teachers on classroom technology integration, and runs Strategic Maths — an initiative transforming how numeracy is taught across Nigerian schools. Her work sits at the intersection of educational excellence and lasting systemic change.",
  },
  {
    name: "Grace Amoka",
    photo: "/founders/grace-amoka.png",
    bio: "Grace holds a degree in Computer Engineering from Covenant University and a Master's in Educational Technology from the University of Ilorin. With over nine years of experience as a teacher, coach, and education consultant, she has worked across K-12 systems on three continents, consulted for the World Bank, and served as a programme coordinator at the African Leadership Academy and Teach for Nigeria — training over 400 educators across more than seven countries. She brings rare rigour and operational depth to everything she builds.",
  },
];

export function FoundersAbout() {
  return (
    <section id="founders" className="bg-navy px-10 py-24">
      <Container>
        <div className="grid items-start gap-20 md:grid-cols-2">
          <IntersectionFade>
            <Eyebrow>About</Eyebrow>
            <h2 className="mb-5 font-heading text-[clamp(26px,3.5vw,40px)] font-extrabold leading-[1.15] text-white">
              Built on one belief: teaching quality determines everything
            </h2>
            <p className="text-base leading-[1.8] text-white/55">
              EduConnect was built on a simple belief: the quality of teaching determines
              everything. We recruit and vet Nigeria&apos;s most capable teachers, then work with
              families across Nigeria, the UK, the US, and Canada to give every child access to
              genuinely excellent instruction. We are a tutoring service — not a platform. That
              means we stay accountable for every teacher we place and every child we serve.
            </p>
            <p className="mt-6 border-t border-white/10 pt-5 text-[13px] text-white/30">
              Backed by MIT.
            </p>
          </IntersectionFade>

          <IntersectionFade delay={150}>
            <Eyebrow className="mb-5">Meet the founders</Eyebrow>
            <div className="flex flex-col gap-5">
              {founders.map((f) => (
                <div
                  key={f.name}
                  className="overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-white/25"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
                    <div className="relative min-h-[240px] overflow-hidden bg-blue/10 md:min-h-0 md:aspect-[3/4]">
                      <Image
                        src={f.photo}
                        alt={f.name}
                        fill
                        sizes="(min-width: 768px) 180px, 100vw"
                        className="object-cover object-top"
                        priority={false}
                      />
                    </div>
                    <div className="p-6">
                      <p className="mb-2 font-heading text-base font-bold text-white">{f.name}</p>
                      <p className="text-[13px] leading-[1.72] text-white/50">{f.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </IntersectionFade>
        </div>
      </Container>
    </section>
  );
}
