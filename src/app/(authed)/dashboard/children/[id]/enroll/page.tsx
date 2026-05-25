import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { createClient } from "@/lib/supabase/server";
import { EnrollForm, type EnrollSubject } from "./EnrollForm";

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, preferred_name, enrollments(subject_id)")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("is_archived", false)
    .order("name");

  const existing = new Set(
    (student.enrollments ?? []).map((e: { subject_id: string }) => e.subject_id),
  );
  const available: EnrollSubject[] =
    (subjects ?? []).filter((s) => !existing.has(s.id));

  const displayName = student.preferred_name ?? student.full_name;

  return (
    <Container>
      <div className="mb-6 text-[13px] text-g600">
        <Link href={`/dashboard?child=${id}`} className="hover:text-navy">
          {displayName}
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">Add subject</span>
      </div>

      <Eyebrow>New enrollment</Eyebrow>
      <h1 className="mt-2 font-heading text-[clamp(26px,3.4vw,38px)] font-semibold leading-[1.1] text-navy">
        Request subjects for {displayName}.
      </h1>
      <p className="mt-3 max-w-[580px] text-[15px] leading-[1.7] text-g600">
        Pick the subjects you&apos;d like to enroll in. Each request goes to our admin team for
        matching. You can request additional subjects later.
      </p>

      <div className="mt-10">
        <EnrollForm studentId={id} subjects={available} />
      </div>
    </Container>
  );
}
