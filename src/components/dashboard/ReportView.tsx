import { BatteryBars } from "@/components/ui/BatteryBars";
import { formatDate, formatDuration, formatRegistrationNumber } from "@/lib/format";

export type ReportViewReport = {
  id: string;
  lesson_date: string;
  duration_minutes: number;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  lesson_highlights: string | null;
  participation: number;
  focus_rating: number;
  homework: number;
  next_focus: string | null;
  how_to_help_at_home: string | null;
  emailed_at: string | null;
};

export type ReportViewStudent = {
  full_name: string;
  preferred_name: string | null;
  registration_number: string;
};

export type ReportViewSubject = {
  name: string;
};

export type ReportViewSkill = {
  id: string;
  name: string;
  description: string | null;
  rating: number | null;
};

function Paragraph({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.7] text-navy">
        {value}
      </p>
    </div>
  );
}

export function ReportView({
  report,
  student,
  subject,
  skills,
}: {
  report: ReportViewReport;
  student: ReportViewStudent;
  subject: ReportViewSubject;
  skills: ReportViewSkill[];
}) {
  const displayName = student.preferred_name ?? student.full_name;

  return (
    <article className="flex flex-col gap-8">
      <header className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6 md:p-8">
        <span className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-navy">
          {formatRegistrationNumber(student.registration_number)}
        </span>
        <h1 className="mt-3 font-heading text-[clamp(26px,3vw,34px)] font-extrabold leading-tight text-navy">
          {subject.name} · {formatDate(report.lesson_date)}
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Lesson report for {displayName} · {formatDuration(report.duration_minutes)}
          {report.emailed_at && ` · emailed ${formatDate(report.emailed_at)}`}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
          <BatteryBars
            label="Understanding"
            description="How well they grasped today's material."
            value={report.understanding_check}
            readOnly
          />
        </div>
        <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
          <BatteryBars
            label="Confidence"
            description="How confident they felt tackling the work."
            value={report.confidence_level}
            readOnly
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Paragraph label="Lesson focus" value={report.lesson_focus} />
        <Paragraph label="Lesson highlights" value={report.lesson_highlights} />
      </section>

      <section>
        <h2 className="mb-3 font-heading text-[18px] font-extrabold text-navy">
          Learning behaviours
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
            <BatteryBars label="Participation" value={report.participation} readOnly />
          </div>
          <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
            <BatteryBars label="Focus" value={report.focus_rating} readOnly />
          </div>
          <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
            <BatteryBars label="Homework" value={report.homework} readOnly />
          </div>
        </div>
      </section>

      {skills.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-[18px] font-extrabold text-navy">
            Skill tracker
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {skills.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border-[1.5px] border-navy/10 bg-white p-5"
              >
                <BatteryBars
                  label={s.name}
                  description={s.description ?? undefined}
                  value={s.rating ?? 0}
                  readOnly
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Paragraph label="Next focus" value={report.next_focus} />
        <Paragraph label="How to help at home" value={report.how_to_help_at_home} />
      </section>
    </article>
  );
}
