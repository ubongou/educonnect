import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { NewPackageForm } from "@/components/teacher/PackageForms";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isDone } from "@/lib/packages/progress";
import { lessonStatusLabel, lessonWhen, loadAddableLessons } from "@/lib/packages/load";

export default async function NewTeacherPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ enrollment?: string }>;
}) {
  const profile = await requireTeacher();
  const { enrollment: enrollmentId } = await searchParams;
  if (!enrollmentId) notFound();

  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, teacher_id, students ( full_name, preferred_name ), subjects ( name )")
    .eq("id", enrollmentId)
    .maybeSingle();
  const e = enrollment as unknown as {
    id: string;
    teacher_id: string | null;
    students: { full_name: string; preferred_name: string | null } | null;
    subjects: { name: string } | null;
  } | null;
  if (!e || e.teacher_id !== profile.id) notFound();

  // Only one open package per child + subject — send them to it.
  const { data: open } = await supabase
    .from("teacher_packages")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("status", "open")
    .maybeSingle();
  if (open) redirect(`/teacher/packages/${open.id}`);

  const lessons = await loadAddableLessons(supabase, profile.id, enrollmentId);
  const name = e.students?.preferred_name ?? e.students?.full_name ?? "Student";

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/teacher/packages" className="hover:text-navy">
          Packages
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">New</span>
      </div>
      <h1 className="mb-2 font-heading text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-navy">
        New package · {name} · {e.subjects?.name ?? "Subject"}
      </h1>
      <p className="mb-8 max-w-[640px] text-[14px] text-g600">
        Choose how many lessons this block is, then tick the lessons that count towards it. You can
        add more as they get booked.
      </p>
      <div className="max-w-[720px] rounded-[28px] border border-line bg-white p-6">
        <NewPackageForm
          enrollmentId={enrollmentId}
          lessons={lessons.map((l) => ({
            id: l.id,
            when: lessonWhen(l),
            statusLabel: lessonStatusLabel(l.status),
            happened: isDone(l.status),
          }))}
        />
      </div>
    </Container>
  );
}
