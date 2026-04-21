import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatRegistrationNumber } from "@/lib/format";
import type { IntakeJson } from "@/types/domain";
import { IntakeSummary } from "@/components/dashboard/IntakeSummary";
import {
  EnrollmentsTab,
  type EnrollmentRow,
} from "@/components/dashboard/EnrollmentsTab";
import { ReportsTab, type ReportRow } from "@/components/dashboard/ReportsTab";

type Tab = "subjects" | "reports" | "intake";
const tabs: { id: Tab; label: string }[] = [
  { id: "subjects", label: "Subjects" },
  { id: "reports", label: "Reports" },
  { id: "intake", label: "Intake" },
];

export default async function ChildDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabRaw } = await searchParams;
  const activeTab: Tab =
    tabRaw === "reports" || tabRaw === "intake" ? tabRaw : "subjects";

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select(
      `
      id, registration_number, full_name, preferred_name, age, gender,
      current_school, curriculum, curriculum_other, intake, intake_submitted_at,
      enrollments(id, status, decided_at, created_at, subjects(name, slug)),
      lesson_reports(id, lesson_date, understanding_check, confidence_level, subjects(name, slug)),
      intake_files(id, kind, original_filename, size_bytes, uploaded_at)
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const displayName = student.preferred_name ?? student.full_name;
  const enrollments = (student.enrollments ?? []) as unknown as EnrollmentRow[];
  const reports = (student.lesson_reports ?? []) as unknown as ReportRow[];
  const intake = (student.intake ?? null) as IntakeJson | null;

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/dashboard" className="hover:text-navy">
          My children
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">{displayName}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-g100 pb-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-navy">
            {formatRegistrationNumber(student.registration_number)}
          </span>
          <h1 className="mt-3 font-heading text-[clamp(28px,3.4vw,40px)] font-extrabold leading-tight text-navy">
            {displayName}
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {student.current_school ?? "School not set"}
            {student.curriculum && ` · ${student.curriculum} curriculum`}
            {typeof student.age === "number" && ` · age ${student.age}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button href={`/dashboard/children/${id}/enroll`}>Add subject</Button>
        </div>
      </div>

      <nav aria-label="Child sections" className="mt-6">
        <ul className="flex gap-1 overflow-x-auto border-b border-g100">
          {tabs.map((t) => {
            const isActive = t.id === activeTab;
            return (
              <li key={t.id}>
                <Link
                  href={`/dashboard/children/${id}?tab=${t.id}`}
                  className={`inline-flex items-center gap-2 border-b-[3px] px-4 py-3 font-heading text-[13px] font-bold uppercase tracking-[0.08em] transition-colors ${
                    isActive
                      ? "border-navy text-navy"
                      : "border-transparent text-g400 hover:text-navy"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8">
        {activeTab === "subjects" && (
          <EnrollmentsTab studentId={id} enrollments={enrollments} />
        )}
        {activeTab === "reports" && (
          <ReportsTab studentId={id} reports={reports} />
        )}
        {activeTab === "intake" && (
          <IntakeSummary
            child={{
              full_name: student.full_name,
              preferred_name: student.preferred_name,
              age: student.age,
              gender: student.gender,
              current_school: student.current_school,
              curriculum: student.curriculum,
              curriculum_other: student.curriculum_other,
              intake_submitted_at: student.intake_submitted_at,
            }}
            intake={intake}
            files={student.intake_files ?? []}
          />
        )}
      </div>
    </Container>
  );
}
