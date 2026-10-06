import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminStudentUpdateSchema, childInfoSchema } from "@/lib/validation";

// -----------------------------------------------------------------------------
// A tiny in-memory stand-in for the service-role client: just the calls the
// reminder job makes, with a real unique index on birthday_reminders.
// -----------------------------------------------------------------------------
type Row = Record<string, unknown>;
const db: { students: Row[]; enrollments: Row[]; birthday_reminders: Row[] } = {
  students: [],
  enrollments: [],
  birthday_reminders: [],
};

function query(table: keyof typeof db) {
  let rows = [...db[table]];
  const api = {
    select: () => api,
    is: (col: string, v: unknown) => ((rows = rows.filter((r) => r[col] === v)), api),
    eq: (col: string, v: unknown) => ((rows = rows.filter((r) => r[col] === v)), api),
    not: (col: string) => ((rows = rows.filter((r) => r[col] !== null)), api),
    in: (col: string, vs: unknown[]) => ((rows = rows.filter((r) => vs.includes(r[col]))), api),
    order: () => api,
    range: async () => ({ data: rows, error: null }),
    then: (resolve: (v: { data: Row[]; error: null }) => void) => resolve({ data: rows, error: null }),
  };
  return api;
}

const client = {
  from(table: keyof typeof db) {
    if (table !== "birthday_reminders") return query(table);
    return {
      insert: (row: Row) => ({
        select: () => ({
          single: async () => {
            const clash = db.birthday_reminders.some(
              (r) => r.student_id === row.student_id && r.birthday === row.birthday && r.kind === row.kind,
            );
            if (clash) return { data: null, error: { code: "23505", message: "duplicate key" } };
            const saved = { id: `r${db.birthday_reminders.length + 1}`, ...row };
            db.birthday_reminders.push(saved);
            return { data: { id: saved.id }, error: null };
          },
        }),
      }),
      delete: () => ({
        eq: async (_col: string, id: string) => {
          db.birthday_reminders = db.birthday_reminders.filter((r) => r.id !== id);
          return { error: null };
        },
      }),
      update: (patch: Row) => ({
        eq: async (_col: string, id: string) => {
          const r = db.birthday_reminders.find((x) => x.id === id);
          if (r) Object.assign(r, patch);
          return { error: null };
        },
      }),
    };
  },
};

vi.mock("@/lib/supabase/server", () => ({ createServiceRoleClient: () => client }));

const send = vi.fn();
vi.mock("@/lib/email/sendBirthdayReminder", () => ({
  sendBirthdayReminderEmail: (input: unknown) => send(input),
}));

const { runBirthdayReminders } = await import("@/lib/birthdayReminders");

// 05:00 UTC on 6 Oct 2026 = 06:00 in Lagos, so "today" is 2026-10-06.
const NOW = new Date("2026-10-06T05:00:00Z");

const student = (id: string, dob: string | null, extra: Row = {}): Row => ({
  id,
  full_name: `Child ${id}`,
  preferred_name: null,
  date_of_birth: dob,
  archived_at: null,
  is_test: false,
  ...extra,
});

beforeEach(() => {
  db.students = [];
  db.enrollments = [];
  db.birthday_reminders = [];
  send.mockReset();
  send.mockResolvedValue({ ok: true, recipients: ["t@example.com", "admin@example.com"] });
});

describe("runBirthdayReminders", () => {
  it("sends the week-before and day-before reminders that are due, to the child's teachers", async () => {
    db.students = [
      student("week", "2016-10-13"), // 7 days out
      student("tomorrow", "2015-10-07"), // 1 day out
      student("far", "2015-11-20"),
      student("unknown", null),
    ];
    db.enrollments = [
      {
        student_id: "week",
        status: "approved",
        subjects: { name: "Maths" },
        teacher: { full_name: "Ada Teacher", email: "ada@example.com", deactivated_at: null },
      },
      {
        student_id: "week",
        status: "approved",
        subjects: { name: "English" },
        teacher: { full_name: "Gone", email: "gone@example.com", deactivated_at: "2026-01-01" },
      },
    ];

    const { today, outcomes } = await runBirthdayReminders(NOW);

    expect(today).toBe("2026-10-06");
    expect(outcomes.map((o) => [o.studentId, o.kind, o.sent])).toEqual([
      ["week", "week_before", true],
      ["tomorrow", "day_before", true],
    ]);
    const weekCall = send.mock.calls.find(([i]) => i.childName === "Child week")![0];
    expect(weekCall.teachers).toEqual([{ email: "ada@example.com", fullName: "Ada Teacher" }]);
    expect(weekCall.subjects).toEqual(["Maths", "English"]);
    expect(weekCall.turning).toBe(10);
  });

  it("never sends the same reminder twice, however often it runs", async () => {
    db.students = [student("a", "2015-10-07")];
    await runBirthdayReminders(NOW);
    await runBirthdayReminders(NOW);
    await runBirthdayReminders(new Date("2026-10-06T20:00:00Z"));
    expect(send).toHaveBeenCalledTimes(1);
    expect(db.birthday_reminders).toHaveLength(1);
    expect(db.birthday_reminders[0].recipients).toEqual(["t@example.com", "admin@example.com"]);
  });

  it("retries on the next run when a send fails", async () => {
    db.students = [student("a", "2015-10-07")];
    send.mockResolvedValueOnce({ ok: false, skipped: false, error: "Resend down" });

    const first = await runBirthdayReminders(NOW);
    expect(first.outcomes[0]).toMatchObject({ sent: false, reason: "Resend down" });
    expect(db.birthday_reminders).toHaveLength(0);

    const second = await runBirthdayReminders(NOW);
    expect(second.outcomes[0].sent).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("skips archived and test children", async () => {
    db.students = [
      student("archived", "2015-10-07", { archived_at: "2026-01-01" }),
      student("test", "2015-10-07", { is_test: true }),
    ];
    const { outcomes } = await runBirthdayReminders(NOW);
    expect(outcomes).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("treats next year's birthday as a new reminder", async () => {
    db.students = [student("a", "2015-10-07")];
    await runBirthdayReminders(NOW);
    await runBirthdayReminders(new Date("2027-10-06T05:00:00Z"));
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("date of birth on forms", () => {
  const base = {
    full_name: "Edan Okon",
    gender: "male",
    curriculum: "british",
  };

  it("is required when registering a child", () => {
    expect(childInfoSchema.safeParse(base).success).toBe(false);
    expect(childInfoSchema.safeParse({ ...base, date_of_birth: "" }).success).toBe(false);
    expect(childInfoSchema.safeParse({ ...base, date_of_birth: "2016-03-12" }).success).toBe(true);
  });

  it("rejects a future or impossible date", () => {
    expect(childInfoSchema.safeParse({ ...base, date_of_birth: "2999-01-01" }).success).toBe(false);
    expect(childInfoSchema.safeParse({ ...base, date_of_birth: "2016-02-30" }).success).toBe(false);
  });

  it("may be left blank when the office edits an older child", () => {
    const blank = adminStudentUpdateSchema.safeParse({ ...base, date_of_birth: "" });
    expect(blank.success).toBe(true);
    expect(blank.success && blank.data.date_of_birth).toBeUndefined();
    expect(adminStudentUpdateSchema.safeParse({ ...base, date_of_birth: "2999-01-01" }).success).toBe(
      false,
    );
  });
});
