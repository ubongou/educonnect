import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AdminIntakeForm } from "@/components/admin/AdminIntakeForm";
import { createClient } from "@/lib/supabase/server";
import type { IntakeJson } from "@/types/domain";

export default async function AdminStudentIntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, preferred_name, intake")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const name = student.preferred_name || student.full_name;

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/admin/students" className="hover:text-navy">
          Students
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <Link href={`/admin/students/${student.id}`} className="hover:text-navy">
          {student.full_name}
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">Questionnaire</span>
      </div>

      <div className="mb-8">
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Questionnaire for {name}
        </h1>
        <p className="mt-2 max-w-[620px] text-[14px] text-g600">
          The same questions parents answer when they sign up. Every question is optional; leave
          out anything the parent didn&rsquo;t answer. Name, date of birth, school and curriculum
          are edited on the student&rsquo;s page.
        </p>
      </div>

      <AdminIntakeForm
        studentId={student.id}
        initial={(student.intake ?? {}) as IntakeJson}
      />
    </Container>
  );
}
