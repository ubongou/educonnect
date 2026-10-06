import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import {
  daysUntilBirthday,
  isValidDate,
  nextBirthday,
  officeToday,
  reminderDue,
  turningAge,
  type ReminderKind,
} from "@/lib/birthdays";
import { sendBirthdayReminderEmail } from "@/lib/email/sendBirthdayReminder";

export type BirthdayReminderOutcome = {
  studentId: string;
  kind: ReminderKind;
  birthday: string;
  sent: boolean;
  reason?: string;
};

type StudentRow = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  date_of_birth: string | null;
};

type EnrollmentRow = {
  student_id: string;
  subjects: { name: string } | null;
  teacher: { full_name: string | null; email: string | null; deactivated_at: string | null } | null;
};

/**
 * The daily birthday job: for every active, real child whose week-before or
 * day-before reminder is due today (Lagos time), email their current teachers
 * with the office copied.
 *
 * Safe to run any number of times. Each reminder is *claimed* in
 * birthday_reminders before it's sent — the unique (child, birthday, kind)
 * row means a second run, even one running at the same moment, finds it
 * taken and skips. A failed send releases the claim so the next run retries.
 * That's why the endpoint that triggers this needs no secret: calling it can
 * only send reminders that are due today, once.
 */
export async function runBirthdayReminders(
  now: Date = new Date(),
): Promise<{ today: string; outcomes: BirthdayReminderOutcome[] }> {
  const supabase = createServiceRoleClient();
  const today = officeToday(now);

  const studentsResult = await fetchAllRows<StudentRow>((from, to) =>
    supabase
      .from("students")
      .select("id, full_name, preferred_name, date_of_birth")
      .is("archived_at", null)
      .eq("is_test", false)
      .not("date_of_birth", "is", null)
      .order("id")
      .range(from, to),
  );
  if (studentsResult.error) throw new Error(`Couldn't read students: ${studentsResult.error}`);

  const due = studentsResult.rows.flatMap((s) => {
    if (!s.date_of_birth || !isValidDate(s.date_of_birth)) return [];
    const daysUntil = daysUntilBirthday(s.date_of_birth, today);
    const kind = reminderDue(daysUntil);
    if (!kind) return [];
    return [
      {
        student: s,
        kind,
        daysUntil,
        birthday: nextBirthday(s.date_of_birth, today),
        turning: turningAge(s.date_of_birth, today),
      },
    ];
  });
  if (due.length === 0) return { today, outcomes: [] };

  const { data: enrollmentData, error: enrollmentErr } = await supabase
    .from("enrollments")
    .select(
      `
      student_id,
      subjects ( name ),
      teacher:profiles!enrollments_teacher_id_fkey ( full_name, email, deactivated_at )
      `,
    )
    .eq("status", "approved")
    .in(
      "student_id",
      due.map((d) => d.student.id),
    );
  if (enrollmentErr) throw new Error(`Couldn't read enrollments: ${enrollmentErr.message}`);
  const enrollments = (enrollmentData ?? []) as unknown as EnrollmentRow[];

  const outcomes: BirthdayReminderOutcome[] = [];
  for (const d of due) {
    const mine = enrollments.filter((e) => e.student_id === d.student.id);
    const teachers = mine
      .map((e) => e.teacher)
      .filter(
        (t): t is { full_name: string | null; email: string; deactivated_at: null } =>
          Boolean(t?.email) && !t?.deactivated_at,
      )
      .map((t) => ({ email: t.email, fullName: t.full_name }));
    const subjects = [...new Set(mine.map((e) => e.subjects?.name).filter((n): n is string => !!n))];

    // Claim first: a duplicate here means this reminder already went out (or
    // another run is sending it right now).
    const { data: claim, error: claimErr } = await supabase
      .from("birthday_reminders")
      .insert({ student_id: d.student.id, birthday: d.birthday, kind: d.kind })
      .select("id")
      .single();
    if (claimErr || !claim) {
      const duplicate = claimErr?.code === "23505";
      if (!duplicate) {
        outcomes.push({
          studentId: d.student.id,
          kind: d.kind,
          birthday: d.birthday,
          sent: false,
          reason: claimErr?.message ?? "Couldn't record the reminder",
        });
      }
      continue;
    }

    const res = await sendBirthdayReminderEmail({
      kind: d.kind,
      childName: d.student.preferred_name ?? d.student.full_name,
      birthday: d.birthday,
      daysUntil: d.daysUntil,
      turning: d.turning,
      subjects,
      teachers,
    });

    if (!res.ok) {
      // Release the claim so tomorrow's run (or the next one today) retries.
      await supabase.from("birthday_reminders").delete().eq("id", claim.id);
      outcomes.push({
        studentId: d.student.id,
        kind: d.kind,
        birthday: d.birthday,
        sent: false,
        reason: res.skipped ? res.reason : res.error,
      });
      continue;
    }

    await supabase
      .from("birthday_reminders")
      .update({ recipients: res.recipients })
      .eq("id", claim.id);
    outcomes.push({ studentId: d.student.id, kind: d.kind, birthday: d.birthday, sent: true });
  }

  return { today, outcomes };
}
