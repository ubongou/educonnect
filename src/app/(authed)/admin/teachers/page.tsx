import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import {
  DeactivateToggle,
  StatusPill,
} from "@/components/admin/DeactivateToggle";

type TeacherRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  deactivated_at: string | null;
  // Aggregated in-memory below.
  students: number;
  upcoming: number;
};

export default async function AdminTeachersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, deactivated_at")
    .eq("role", "teacher")
    .order("deactivated_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  const teacherIds = (profiles ?? []).map((p) => p.id);

  const [{ data: enrollments }, { data: upcomingSessions }] = await Promise.all([
    teacherIds.length
      ? supabase
          .from("enrollments")
          .select("student_id, teacher_id")
          .in("teacher_id", teacherIds)
          .eq("status", "approved")
      : { data: [] },
    teacherIds.length
      ? supabase
          .from("sessions")
          .select("teacher_id")
          .in("teacher_id", teacherIds)
          .eq("status", "scheduled")
          .gte("session_date", new Date().toISOString().slice(0, 10))
      : { data: [] },
  ]);

  const studentsByTeacher = new Map<string, Set<string>>();
  for (const e of enrollments ?? []) {
    const key = (e as { teacher_id: string | null }).teacher_id;
    if (!key) continue;
    const studentId = (e as { student_id: string }).student_id;
    if (!studentsByTeacher.has(key)) studentsByTeacher.set(key, new Set());
    studentsByTeacher.get(key)!.add(studentId);
  }

  const upcomingByTeacher = new Map<string, number>();
  for (const s of upcomingSessions ?? []) {
    const key = (s as { teacher_id: string }).teacher_id;
    upcomingByTeacher.set(key, (upcomingByTeacher.get(key) ?? 0) + 1);
  }

  const rows: TeacherRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    created_at: p.created_at,
    deactivated_at: p.deactivated_at,
    students: studentsByTeacher.get(p.id)?.size ?? 0,
    upcoming: upcomingByTeacher.get(p.id) ?? 0,
  }));

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Admin
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">Teachers</h1>
          <p className="mt-2 text-[14px] text-g600">
            Create and manage teacher accounts. Teachers can compose lesson reports for the
            enrollments you assign to them.
          </p>
        </div>
        <Button href="/admin/teachers/new">New teacher</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
          <p className="text-[14px] text-g600">
            No teachers yet. Create the first one to start assigning enrollments.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3 text-right">Students</th>
                <th className="px-5 py-3 text-right">Upcoming</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = r.deactivated_at == null;
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-line transition-colors hover:bg-paper ${
                      active ? "" : "bg-paper/50"
                    }`}
                  >
                    <td className="px-5 py-3 font-heading font-bold">
                      <Link
                        href={`/admin/teachers/${r.id}`}
                        className={`underline-offset-4 hover:underline ${
                          active ? "text-navy" : "text-g600"
                        }`}
                      >
                        {r.full_name ?? "Unnamed teacher"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-g600">{r.email ?? "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-navy">
                      {r.students}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-navy">
                      {r.upcoming}
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
