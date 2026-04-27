import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { requireAdmin } from "@/lib/auth";
import type { SectionId } from "@/lib/marketing/schemas";

type Tile = {
  id: SectionId;
  title: string;
  description: string;
  group: "Globals" | "Homepage" | "Pricing page";
};

const tiles: Tile[] = [
  {
    id: "globals",
    title: "Site globals",
    description:
      "Booking link, contact email, social URLs — used everywhere across both pages.",
    group: "Globals",
  },
  {
    id: "hero",
    title: "Hero",
    description:
      "Top-of-page heading with yellow accent, lead text, CTAs, MIT badge, hero photo, and the two floating cards.",
    group: "Homepage",
  },
  {
    id: "marquee",
    title: "Subjects marquee",
    description: "The scrolling list of subjects under the hero.",
    group: "Homepage",
  },
  {
    id: "why_grid",
    title: "Why EduConnect grid",
    description: "Three pillar cards explaining what sets EduConnect apart.",
    group: "Homepage",
  },
  {
    id: "how_it_works",
    title: "Data driven results",
    description:
      "Dark navy section with copy and the parent dashboard preview.",
    group: "Homepage",
  },
  {
    id: "testimonials",
    title: "Testimonials",
    description: "Three parent quotes with author + location.",
    group: "Homepage",
  },
  {
    id: "founders",
    title: "Founders",
    description: "Intro plus two founder bios with portrait photos.",
    group: "Homepage",
  },
  {
    id: "contact",
    title: "Contact section",
    description: "The 'Let's talk' block with email, Instagram, and Facebook.",
    group: "Homepage",
  },
  {
    id: "pricing_intro",
    title: "Pricing intro",
    description: "Header above the tier cards (yellow-accent title).",
    group: "Pricing page",
  },
  {
    id: "pricing_tiers",
    title: "Pricing tiers",
    description: "Three session-package tiers in NGN, USD, GBP, and CAD.",
    group: "Pricing page",
  },
  {
    id: "pricing_faq",
    title: "Pricing FAQ",
    description: "Accordion of frequently-asked questions under the tiers.",
    group: "Pricing page",
  },
];

export default async function AdminContentPage() {
  await requireAdmin();

  const groups: Record<Tile["group"], Tile[]> = {
    Globals: [],
    Homepage: [],
    "Pricing page": [],
  };
  for (const t of tiles) groups[t.group].push(t);

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          Site content
        </h1>
        <p className="mt-2 max-w-[720px] text-[14px] text-g600">
          Edit the strings, images, and prices on the public marketing pages.
          Changes go live the moment you save — no redeploy needed.
        </p>
      </div>

      {(Object.keys(groups) as Tile["group"][]).map((group) => (
        <section key={group} className="mb-10">
          <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            {group}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups[group].map((t) => (
              <Link
                key={t.id}
                href={`/admin/content/${t.id}`}
                className="group flex flex-col rounded-lg border-[1.5px] border-g100 bg-white p-6 transition-colors hover:border-navy"
              >
                <p className="font-heading text-[15px] font-extrabold text-navy">
                  {t.title}
                </p>
                <p className="mt-2 text-[13px] leading-[1.55] text-g600">
                  {t.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-blue">
                  Edit
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3 w-3 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 8h8M8 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Container>
  );
}
