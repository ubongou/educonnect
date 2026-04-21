import type { ReactNode } from "react";
import type { IntakeFileKind, IntakeJson } from "@/types/domain";
import { formatDate } from "@/lib/format";

const labels: Record<string, string> = {
  // learning_background
  yes: "Yes",
  no: "No",
  // strengths.interests
  reading: "Reading",
  writing: "Writing",
  music: "Music",
  sports: "Sports",
  art: "Art",
  games: "Games",
  technology: "Technology",
  // challenges.response_when_difficult
  tries_again: "Tries again",
  asks_for_help: "Asks for help",
  gets_frustrated: "Gets frustrated",
  withdraws: "Withdraws",
  it_depends: "It depends",
  // motivation.motivators
  praise: "Praise",
  rewards: "Rewards",
  challenge: "A challenge",
  independence: "Independence",
  competition: "Competition",
  structured_guidance: "Structured guidance",
  not_sure: "Not sure",
  // behaviour.attention_span
  very_focused: "Very focused",
  short_bursts: "Short bursts",
  easily_distracted: "Easily distracted",
  needs_supervision: "Needs supervision",
  varies: "Varies",
  // behaviour.work_preference
  alone: "Prefers to work alone",
  with_guidance: "Prefers guidance",
  mix: "A mix",
  // personality.traits
  quiet: "Quiet",
  talkative: "Talkative",
  curious: "Curious",
  shy: "Shy",
  confident: "Confident",
  careful: "Careful",
  perfectionist: "Perfectionist",
  reflective: "Reflective",
  independent: "Independent",
  // curriculum
  british: "British",
  nigerian: "Nigerian",
  american: "American",
  other: "Other",
  // gender
  male: "Male",
  female: "Female",
  prefer_not_to_say: "Prefer not to say",
  // intake file kinds
  curriculum: "Curriculum document",
  school_report: "School report",
  class_notes: "Class notes",
};

function humanize(v: string): string {
  return labels[v] ?? v.replace(/_/g, " ");
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        {label}
      </dt>
      <dd className="text-[14px] leading-[1.6] text-navy">{value}</dd>
    </div>
  );
}

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border-[1.5px] border-navy/10 bg-white [&[open]>summary>svg]:rotate-180"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <span className="font-heading text-[15px] font-extrabold text-navy">{title}</span>
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0 text-navy transition-transform"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="border-t border-g100 px-5 py-5">{children}</div>
    </details>
  );
}

function Chips({ values }: { values: readonly string[] }) {
  if (values.length === 0) return <span className="text-g400">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <span
          key={v}
          className="rounded-pill border-[1.5px] border-navy/15 bg-g50 px-3 py-1 text-[12px] font-semibold text-navy"
        >
          {humanize(v)}
        </span>
      ))}
    </div>
  );
}

export type IntakeSummaryProps = {
  child: {
    full_name: string;
    preferred_name: string | null;
    age: number | null;
    gender: string | null;
    current_school: string | null;
    curriculum: string | null;
    curriculum_other: string | null;
    intake_submitted_at: string | null;
  };
  intake: IntakeJson | null;
  files: Array<{
    id: string;
    kind: IntakeFileKind | string;
    original_filename: string;
    size_bytes: number | null;
    uploaded_at: string;
  }>;
};

export function IntakeSummary({ child, intake, files }: IntakeSummaryProps) {
  const i = intake ?? {};

  return (
    <div className="flex flex-col gap-3">
      <Section title="About your child" defaultOpen>
        <dl className="grid gap-5 md:grid-cols-2">
          <Field label="Full name" value={child.full_name} />
          <Field label="Preferred name" value={child.preferred_name ?? "—"} />
          <Field label="Age" value={child.age ?? "—"} />
          <Field label="Gender" value={child.gender ? humanize(child.gender) : "—"} />
          <Field label="Current school" value={child.current_school ?? "—"} />
          <Field
            label="Curriculum"
            value={
              child.curriculum === "other" && child.curriculum_other
                ? `${humanize(child.curriculum)} — ${child.curriculum_other}`
                : child.curriculum
                  ? humanize(child.curriculum)
                  : "—"
            }
          />
          {child.intake_submitted_at && (
            <Field label="Submitted" value={formatDate(child.intake_submitted_at)} />
          )}
        </dl>

        {files.length > 0 && (
          <div className="mt-6 border-t border-g100 pt-5">
            <p className="mb-3 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              Uploaded files
            </p>
            <ul className="flex flex-col gap-2">
              {files.map((f) => (
                <li key={f.id}>
                  <a
                    href={`/api/intake-files/${f.id}/download`}
                    className="inline-flex items-center gap-3 rounded-md border-[1.5px] border-navy/10 bg-g50 px-3 py-2 text-[13px] text-navy transition-colors hover:border-navy/30"
                  >
                    <span className="font-heading font-bold">{humanize(f.kind)}</span>
                    <span className="text-g600">{f.original_filename}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Learning background">
        <dl className="grid gap-5 md:grid-cols-2">
          <Field
            label="Prior tutoring"
            value={i.learning_background?.prior_tutoring ? humanize(i.learning_background.prior_tutoring) : "—"}
          />
          <Field
            label="Notes"
            value={i.learning_background?.prior_tutoring_notes ?? "—"}
          />
          <Field
            label="Recent changes"
            value={i.learning_background?.recent_changes ?? "—"}
            />
        </dl>
      </Section>

      <Section title="Strengths and interests">
        <dl className="grid gap-5 md:grid-cols-2">
          <Field
            label="Enjoys or excels at"
            value={i.strengths?.enjoys_or_excels_at ?? "—"}
          />
          <Field
            label="Confident situations"
            value={i.strengths?.confident_situations ?? "—"}
          />
          <div className="md:col-span-2">
            <Field label="Interests" value={<Chips values={i.strengths?.interests ?? []} />} />
          </div>
        </dl>
      </Section>

      <Section title="Challenges">
        <dl className="grid gap-5 md:grid-cols-2">
          <Field
            label="Challenging areas"
            value={i.challenges?.challenging_areas ?? "—"}
          />
          <Field
            label="Struggling subjects"
            value={i.challenges?.struggling_subjects ?? "—"}
          />
          <Field
            label="When work feels hard"
            value={
              i.challenges?.response_when_difficult
                ? humanize(i.challenges.response_when_difficult)
                : "—"
            }
          />
          <Field
            label="Main concerns"
            value={i.challenges?.main_concerns ?? "—"}
          />
        </dl>
      </Section>

      <Section title="Motivation">
        <dl className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Motivators" value={<Chips values={i.motivation?.motivators ?? []} />} />
          </div>
          <Field label="What puts them off" value={i.motivation?.demotivators ?? "—"} />
        </dl>
      </Section>

      <Section title="Behaviour">
        <dl className="grid gap-5 md:grid-cols-2">
          <Field
            label="Attention span"
            value={i.behaviour?.attention_span ? humanize(i.behaviour.attention_span) : "—"}
          />
          <Field
            label="Work preference"
            value={i.behaviour?.work_preference ? humanize(i.behaviour.work_preference) : "—"}
          />
          <Field
            label="Shows confusion by"
            value={i.behaviour?.how_communicates_confusion ?? "—"}
          />
          <Field
            label="Helpful routines"
            value={i.behaviour?.helpful_routines ?? "—"}
          />
        </dl>
      </Section>

      <Section title="Personality">
        <dl className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Description" value={i.personality?.description ?? "—"} />
          </div>
          <div className="md:col-span-2">
            <Field label="Traits" value={<Chips values={i.personality?.traits ?? []} />} />
          </div>
          <Field
            label="Verbal expression comfort"
            value={
              i.personality?.verbal_expression_comfort
                ? `${i.personality.verbal_expression_comfort}/5`
                : "—"
            }
          />
        </dl>
      </Section>

      <Section title="Goals">
        <dl className="grid gap-5 md:grid-cols-2">
          <Field
            label="Improvement in 8–12 weeks"
            value={i.goals?.improvement_8_12_weeks ?? "—"}
          />
          <Field
            label="Priority breakthrough"
            value={i.goals?.breakthrough_priority ?? "—"}
          />
        </dl>
      </Section>
    </div>
  );
}
