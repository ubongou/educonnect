import { Container } from "@/components/ui/Container";
import { ChildTabs, type ChildTabOption } from "@/components/dashboard/ChildTabs";
import {
  DocumentUpload,
  type UploadedDocument,
} from "@/components/dashboard/DocumentUpload";
import { createClient } from "@/lib/supabase/server";
import { getParentChildren, pickChild, childTabColor } from "@/lib/dashboard/children";

export default async function DashboardDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const { child: childIdRaw } = await searchParams;
  const { children } = await getParentChildren("/dashboard/documents");
  const selected = pickChild(children, childIdRaw);

  if (!selected) {
    return (
      <Container>
        <p className="text-[14px] text-g600">Add a child first to upload documents.</p>
      </Container>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("student_documents")
    .select("id, kind, original_filename, size_bytes, uploaded_at")
    .eq("student_id", selected.id)
    .order("uploaded_at", { ascending: false });

  const documents = (data ?? []) as UploadedDocument[];
  const childOptions: ChildTabOption[] = children.map((c, i) => ({
    id: c.id,
    label: c.preferred_name ?? c.full_name,
    dotColor: childTabColor(i),
  }));

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Parent dashboard
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          Documents
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Share test papers, school reports, and exam results with your child&apos;s
          teacher.
        </p>
      </div>

      <ChildTabs
        basePath="/dashboard/documents"
        children={childOptions}
        activeId={selected.id}
      />

      <DocumentUpload studentId={selected.id} documents={documents} />
    </Container>
  );
}
