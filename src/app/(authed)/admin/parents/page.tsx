import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  DeactivateToggle,
  StatusPill,
} from "@/components/admin/DeactivateToggle";

type ParentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  deactivated_at: string | null;
  parent_students: { student_id: string }[] | null;
};

export default async function AdminParentsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, created_at, deactivated_at, parent_students ( student_id )",
    )
    .eq("role", "parent")
    .order("deactivated_at", { ascending: true, nullsFirst: true })
    .order("full_name");

  const rows = (data ?? []) as ParentProfile[];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Parents
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Every parent who has signed up. Deactivating a parent locks their
          login but preserves all linked student records, intake history, and
          uploaded documents.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
          <p className="text-[14px] text-g600">No parents have signed up yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3 text-right">Children</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = r.deactivated_at == null;
                const childCount = r.parent_students?.length ?? 0;
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-line transition-colors hover:bg-paper ${
                      active ? "" : "bg-paper/50 text-g600"
                    }`}
                  >
                    <td className="px-5 py-3 font-heading font-bold">
                      <span className={active ? "text-navy" : "text-g600"}>
                        {r.full_name ?? "Unnamed parent"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.email ? (
                        <a
                          href={`mailto:${r.email}`}
                          className="text-blue underline-offset-4 hover:underline"
                        >
                          {r.email}
                        </a>
                      ) : (
                        <span className="text-g400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">{r.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {childCount > 0 ? (
                        <Link
                          href={`/admin/students?parent=${r.id}`}
                          className="text-blue underline-offset-4 hover:underline"
                        >
                          {childCount}
                        </Link>
                      ) : (
                        childCount
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill active={active} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DeactivateToggle profileId={r.id} active={active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
