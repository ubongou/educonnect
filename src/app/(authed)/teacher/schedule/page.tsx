import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  lesson_report_id: string | null;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
};

function groupByDay(rows: SessionRow[]): Map<string, SessionRow[]> {
  const out = new Map<string, SessionRow[]>();
  for (const r of rows) {
    const d = new Date(r.scheduled_at);
    const key = d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(r);
  }
  return out;
}

const toneByStatus: Record<string, "blue" | "gray" | "coral" | "green"> = {
  scheduled: "blue",
  completed: "green",
  cancelled: "gray",
  no_show: "coral",
};

export default async function TeacherSchedulePage() {
  const profile = await requireTeacher();
  const supabase = await createClient();

  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("sessions")
    .select(
      `
      id, scheduled_at, duration_minutes, status, lesson_report_id,
      students ( id, full_name, preferred_name ),
      subjects ( name )
      `,
    )
    .eq("teacher_id", profile.id)
    .gte("scheduled_at", fromDate.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(60);

  const rows = (data ?? []) as unknown as SessionRow[];
  const grouped = groupByDay(rows);

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          My schedule
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Your upcoming sessions. Admins set the schedule — reach out if something
          needs to change.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
          <p className="text-[14px] text-g600">
            No upcoming sessions on your calendar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
                {day}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((s) => {
                  const d = new Date(s.scheduled_at);
                  const time = d.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const displayName =
                    s.students?.preferred_name ??
                    s.students?.full_name ??
                    "Unknown";
                  const tone = toneByStatus[s.status] ?? "blue";
                  const needsReport =
                    s.status === "scheduled" && s.lesson_report_id === null;
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-[1.5px] border-navy/10 bg-white px-5 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-heading text-[20px] font-extrabold tabular-nums text-navy">
                          {time}
                        </span>
                        <div>
                          <p className="font-heading text-[15px] font-extrabold text-navy">
                            {displayName} · {s.subjects?.name ?? "Subject"}
                          </p>
                          <p className="mt-1 text-[12px] text-g400">
                            {s.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {needsReport && (
                          <Link
                            href={`/teacher/sessions?session=${s.id}`}
                            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                          >
                            Write report →
                          </Link>
                        )}
                        <StatusBadge tone={tone}>
                          {s.status.replace("_", " ")}
                        </StatusBadge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
