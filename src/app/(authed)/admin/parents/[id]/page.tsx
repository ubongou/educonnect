import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatRegistrationNumber } from "@/lib/format";
import { ProfileManageBar } from "@/components/admin/ProfileManageBar";

type ChildLink = {
  students: {
    id: string;
    full_name: string;
    preferred_name: string | null;
    registration_number: string;
    current_school: string | null;
  } | null;
};

export default async function AdminParentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: parent } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, deactivated_at")
    .eq("id", id)
    .eq("role", "parent")
    .maybeSingle();

  if (!parent) notFound();

  const { data: links } = await supabase
    .from("parent_students")
    .select(
      `
      students (
        id, full_name, preferred_name, registration_number, current_school
      )
      `,
    )
    .eq("parent_id", id);

  const children = ((links ?? []) as unknown as ChildLink[])
    .map((l) => l.students)
    .filter((s): s is NonNullable<ChildLink["students"]> => s !== null);

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/admin/parents" className="hover:text-navy">
          Parents
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">
          {parent.full_name ?? "Unnamed parent"}
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <h1 className="font-heading text-[clamp(28px,3.4vw,40px)] font-semibold leading-tight text-navy">
            {parent.full_name ?? "Unnamed parent"}
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {parent.email ?? "no email"}
            {parent.phone && ` · ${parent.phone}`}
            {` · joined ${formatDate(parent.created_at)}`}
          </p>
        </div>
        <ProfileManageBar
          profileId={parent.id}
          fullName={parent.full_name ?? "Unnamed parent"}
          phone={parent.phone ?? ""}
          email={parent.email ?? ""}
          active={parent.deactivated_at == null}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Children
        </h2>
        {children.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No students linked to this parent yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {children.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-semibold text-navy">
                    {c.preferred_name ?? c.full_name}
                  </p>
                  <p className="mt-1 text-[12px] text-g400">
                    {formatRegistrationNumber(c.registration_number)}
                    {c.current_school && ` · ${c.current_school}`}
                  </p>
                </div>
                <Link
                  href={`/admin/students/${c.id}`}
                  className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                >
                  Student detail →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
