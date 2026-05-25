import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRegistrationNumber } from "@/lib/format";

type EnrollmentRow = {
  id: string;
  status: string;
  student_id: string;
  subjects: { name: string } | null;
  students: {
    id: string;
    full_name: string;
    preferred_name: string | null;
    registration_number: string;
    current_school: string | null;
  } | null;
};

export default async function TeacherStudentsPage() {
  const profile = await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      id, status, student_id,
      subjects ( name ),
      students ( id, full_name, preferred_name, registration_number, current_school )
      `,
    )
    .eq("teacher_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as EnrollmentRow[];

  // Group subjects per student.
  const byStudent = new Map<
    string,
    {
      id: string;
      full_name: string;
      preferred_name: string | null;
      registration_number: string;
      current_school: string | null;
      subjects: string[];
    }
  >();
  for (const r of rows) {
    if (!r.students) continue;
    const key = r.students.id;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        id: r.students.id,
        full_name: r.students.full_name,
        preferred_name: r.students.preferred_name,
        registration_number: r.students.registration_number,
        current_school: r.students.current_school,
        subjects: [],
      });
    }
    const name = r.subjects?.name;
    if (name) byStudent.get(key)!.subjects.push(name);
  }

  const students = Array.from(byStudent.values());

  function initials(name: string): string {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("");
  }

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          My students
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Every student you&apos;re teaching. Tap a card for intake, documents, and
          past reports.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
          <p className="text-[14px] text-g600">
            No students assigned yet. Admins will assign them on enrollment approval.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {students.map((s) => {
            const display = s.preferred_name ?? s.full_name;
            return (
              <li key={s.id}>
                <Link
                  href={`/teacher/students/${s.id}`}
                  className="group flex items-start gap-4 rounded-[28px] border border-line bg-white p-5 transition-colors hover:border-navy/30"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill bg-yellow font-heading text-[13px] font-semibold text-navy">
                    {initials(s.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-heading text-[16px] font-semibold text-navy">
                        {display}
                      </p>
                      <StatusBadge tone="blue">Active</StatusBadge>
                    </div>
                    <p className="mt-1 text-[12px] text-g400">
                      {formatRegistrationNumber(s.registration_number)}
                      {s.current_school && ` · ${s.current_school}`}
                    </p>
                    <p className="mt-2 text-[13px] text-g600">
                      {s.subjects.join(", ")}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
