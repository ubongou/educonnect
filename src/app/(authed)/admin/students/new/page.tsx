import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  StudentCreateForm,
  type ParentOption,
} from "@/components/admin/StudentCreateForm";

export default async function AdminNewStudentPage() {
  const supabase = await createClient();

  const { data: parents } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "parent")
    .is("deactivated_at", null)
    .order("full_name");

  const parentOptions: ParentOption[] = (parents ?? []).map((p) => ({
    id: p.id,
    label: p.full_name
      ? `${p.full_name}${p.email ? ` · ${p.email}` : ""}`
      : (p.email ?? "Unnamed parent"),
  }));

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/admin/students" className="hover:text-navy">
          Students
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">New student</span>
      </div>

      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          New student
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Create a student record directly. The intake questionnaire can be
          completed later by the linked parent.
        </p>
      </div>

      <div className="max-w-2xl">
        <StudentCreateForm parents={parentOptions} />
      </div>
    </Container>
  );
}
