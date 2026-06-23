import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRegistrationNumber } from "@/lib/format";
import { StudentTabsNav } from "@/components/teacher/StudentTabsNav";
import {
  MaterialsUpload,
  type TeacherMaterial,
} from "@/components/teacher/MaterialsUpload";

export default async function TeacherStudentMaterials({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireTeacher();
  const { id } = await params;
  const supabase = await createClient();

  // Same assignment check as the overview tab — a teacher must have an
  // enrollment with this student. RLS would block the reads anyway, but the
  // explicit check yields a clean 404.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", id)
    .eq("teacher_id", profile.id)
    .limit(1)
    .maybeSingle();
  if (!enrollment) notFound();

  const { data: student } = await supabase
    .from("students")
    .select("id, registration_number, full_name, preferred_name")
    .eq("id", id)
    .maybeSingle();
  if (!student) notFound();

  const { data: materials } = await supabase
    .from("teacher_materials")
    .select("id, kind, original_filename, size_bytes, uploaded_at, mime_type")
    .eq("student_id", id)
    .eq("status", "ready")
    .is("lesson_report_id", null)
    .order("uploaded_at", { ascending: false });

  const teacherMaterials = (materials ?? []) as TeacherMaterial[];
  const displayName = student.preferred_name ?? student.full_name;

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/teacher/students" className="hover:text-navy">
          My students
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <Link href={`/teacher/students/${id}`} className="hover:text-navy">
          {displayName}
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">Materials</span>
      </div>

      <div className="border-b border-line pb-8">
        <span className="inline-flex items-center gap-2 rounded-pill border border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-semibold uppercase tracking-[0.1em] text-navy">
          {formatRegistrationNumber(student.registration_number)}
        </span>
        <h1 className="mt-3 font-heading text-[clamp(28px,3.4vw,40px)] font-semibold leading-tight text-navy">
          {displayName}
        </h1>
      </div>

      <StudentTabsNav id={id} active="materials" />

      <section className="mt-10">
        <h2 className="mb-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Materials I&apos;ve shared with {displayName}
        </h2>
        <p className="mb-4 text-[13px] text-g600">
          Send a file directly to the parent — for anything not tied to a lesson
          report. Homework for a specific lesson is best attached to that
          report instead.
        </p>
        <MaterialsUpload studentId={id} materials={teacherMaterials} />
      </section>
    </Container>
  );
}
