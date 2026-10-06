import type { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";
import {
  runwayFor,
  tallyPackage,
  type PackageStatus,
  type PackageTally,
  type Runway,
} from "./progress";

type Client = Awaited<ReturnType<typeof createClient>>;

export type PackageLesson = {
  id: string;
  status: string;
  session_date: string;
  scheduled_at: string | null;
  duration_minutes: number;
};

export type PackageView = {
  id: string;
  status: PackageStatus;
  size: number;
  note: string | null;
  completionNote: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  /** Open again after the office sent it back — the review note says why. */
  returned: boolean;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  enrollmentId: string;
  subjectName: string;
  lessons: PackageLesson[];
  tally: PackageTally;
  runway: Runway;
};

type Row = {
  id: string;
  status: string;
  size: number;
  note: string | null;
  completion_note: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  created_at: string;
  teacher_id: string;
  student_id: string;
  enrollment_id: string;
  teacher: { full_name: string | null } | null;
  students: { full_name: string; preferred_name: string | null } | null;
  enrollments: { subjects: { name: string } | null } | null;
  lessons: Array<{ sessions: PackageLesson | null }>;
};

/**
 * Reads packages through the caller's client, so RLS scopes a teacher to their
 * own and gives an admin everything. Never selects anything money-related —
 * there's nothing money-related on these tables to select.
 */
export async function loadPackages(
  supabase: Client,
  filter: {
    teacherId?: string;
    studentId?: string;
    statuses?: PackageStatus[];
    ids?: string[];
    limit?: number;
  } = {},
): Promise<{ packages: PackageView[]; error: string | null }> {
  let q = supabase
    .from("teacher_packages")
    .select(
      `
      id, status, size, note, completion_note, review_note, reviewed_at,
      completed_at, created_at, teacher_id, student_id, enrollment_id,
      teacher:profiles!teacher_packages_teacher_id_fkey ( full_name ),
      students ( full_name, preferred_name ),
      enrollments ( subjects ( name ) ),
      lessons:teacher_package_sessions (
        sessions ( id, status, session_date, scheduled_at, duration_minutes )
      )
      `,
    )
    .order("created_at", { ascending: false });

  if (filter.teacherId) q = q.eq("teacher_id", filter.teacherId);
  if (filter.studentId) q = q.eq("student_id", filter.studentId);
  if (filter.statuses) q = q.in("status", filter.statuses);
  if (filter.ids) q = q.in("id", filter.ids);
  if (filter.limit) q = q.limit(filter.limit);

  const { data, error } = await q;
  if (error) return { packages: [], error: error.message };

  const packages = ((data ?? []) as unknown as Row[]).map((r): PackageView => {
    const lessons = r.lessons
      .map((l) => l.sessions)
      .filter((s): s is PackageLesson => s !== null)
      .sort((a, b) => a.session_date.localeCompare(b.session_date));
    const tally = tallyPackage(r.size, lessons);
    const status = r.status as PackageStatus;
    return {
      id: r.id,
      status,
      size: r.size,
      note: r.note,
      completionNote: r.completion_note,
      reviewNote: r.review_note,
      reviewedAt: r.reviewed_at,
      completedAt: r.completed_at,
      createdAt: r.created_at,
      returned: status === "open" && r.reviewed_at !== null,
      teacherId: r.teacher_id,
      teacherName: r.teacher?.full_name ?? "Teacher",
      studentId: r.student_id,
      studentName: r.students?.preferred_name ?? r.students?.full_name ?? "Student",
      enrollmentId: r.enrollment_id,
      subjectName: r.enrollments?.subjects?.name ?? "Subject",
      lessons,
      tally,
      runway: runwayFor(tally),
    };
  });

  return { packages, error: null };
}

export function lessonStatusLabel(status: string): string {
  if (status === "completed") return "Taught";
  if (status === "no_show") return "No-show";
  if (status === "cancelled") return "Cancelled";
  return "Booked";
}

export function lessonStatusTone(status: string): "green" | "coral" | "gray" | "blue" {
  if (status === "completed") return "green";
  if (status === "no_show") return "coral";
  if (status === "cancelled") return "gray";
  return "blue";
}

/** "Mon 12 Oct 2026 · 16:00 · 1 hr" — time only when one was scheduled. */
export function lessonWhen(l: Pick<PackageLesson, "session_date" | "scheduled_at" | "duration_minutes">): string {
  const day = new Date(`${l.session_date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = l.scheduled_at
    ? new Date(l.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;
  return [day, time, formatDuration(l.duration_minutes)].filter(Boolean).join(" · ");
}

/** How far back a teacher can reach when putting lessons on a package. */
export const ADDABLE_LOOKBACK_DAYS = 90;

/**
 * A teacher's lessons for one child + subject that can still go on a package:
 * their own, not cancelled, not already on one of their packages, and from the
 * last {@link ADDABLE_LOOKBACK_DAYS} days onwards. The database re-checks all
 * of this on save.
 */
export async function loadAddableLessons(
  supabase: Client,
  teacherId: string,
  enrollmentId: string,
): Promise<PackageLesson[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - ADDABLE_LOOKBACK_DAYS);

  const [{ data: sessions }, { data: packaged }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, status, session_date, scheduled_at, duration_minutes")
      .eq("teacher_id", teacherId)
      .eq("enrollment_id", enrollmentId)
      .neq("status", "cancelled")
      .gte("session_date", since.toISOString().slice(0, 10))
      .order("session_date", { ascending: true })
      .limit(300),
    supabase
      .from("teacher_package_sessions")
      .select("session_id, teacher_packages!inner ( enrollment_id )")
      .eq("teacher_packages.enrollment_id", enrollmentId),
  ]);

  const taken = new Set((packaged ?? []).map((p) => p.session_id));
  return ((sessions ?? []) as PackageLesson[]).filter((s) => !taken.has(s.id));
}
