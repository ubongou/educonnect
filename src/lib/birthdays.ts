/**
 * Children's birthdays — the date maths, kept pure so the reminder job, the
 * dashboards and the forms agree.
 *
 * Dates are calendar days ("YYYY-MM-DD"), never instants. "Today" is the
 * office's day in Lagos, so a reminder lands on the same morning for everyone
 * however far the family is from Nigeria.
 */

export const OFFICE_TIME_ZONE = "Africa/Lagos";

/** Matches the students.age CHECK (1–25, migration 0041). */
export const MIN_AGE = 1;
export const MAX_AGE = 25;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

type Ymd = { y: number; m: number; d: number };

function parse(date: string): Ymd | null {
  const match = DATE_RE.exec(date);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function fmt({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function toUtc(x: Ymd): number {
  return Date.UTC(x.y, x.m - 1, x.d);
}

export function isValidDate(date: string): boolean {
  return parse(date) !== null;
}

/** Today's calendar date in Lagos. */
export function officeToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: OFFICE_TIME_ZONE });
}

/**
 * The day a birthday falls on in a given year. A 29 February birthday is
 * marked on 28 February in non-leap years.
 */
export function birthdayInYear(dob: string, year: number): string {
  const b = parse(dob);
  if (!b) throw new Error(`Invalid date of birth: ${dob}`);
  if (b.m === 2 && b.d === 29 && !isLeap(year)) return fmt({ y: year, m: 2, d: 28 });
  return fmt({ y: year, m: b.m, d: b.d });
}

/** The next birthday on or after `today`. */
export function nextBirthday(dob: string, today: string): string {
  const t = parse(today);
  if (!t) throw new Error(`Invalid date: ${today}`);
  const thisYear = birthdayInYear(dob, t.y);
  return thisYear >= today ? thisYear : birthdayInYear(dob, t.y + 1);
}

/** Whole days from `today` to the next birthday (0 = today). */
export function daysUntilBirthday(dob: string, today: string): number {
  const next = parse(nextBirthday(dob, today))!;
  const t = parse(today)!;
  return Math.round((toUtc(next) - toUtc(t)) / 86_400_000);
}

/** Age in completed years on `date`. */
export function ageOn(dob: string, date: string): number {
  const b = parse(dob);
  const t = parse(date);
  if (!b || !t) throw new Error("Invalid date");
  const hadBirthday = date >= birthdayInYear(dob, t.y);
  return t.y - b.y - (hadBirthday ? 0 : 1);
}

/** The age a child turns on their next birthday. */
export function turningAge(dob: string, today: string): number {
  const next = nextBirthday(dob, today);
  return Number(next.slice(0, 4)) - Number(dob.slice(0, 4));
}

/**
 * Validation for a date of birth entered on a form: a real date, not in the
 * future, and an age the platform takes (matches the students.age CHECK).
 * Returns an error message, or null when it's fine.
 */
export function dateOfBirthError(dob: string, today: string = officeToday()): string | null {
  if (!isValidDate(dob)) return "Enter a valid date of birth.";
  if (dob > today) return "Date of birth can't be in the future.";
  const age = ageOn(dob, today);
  if (age < MIN_AGE || age > MAX_AGE) {
    return `Children must be between ${MIN_AGE} and ${MAX_AGE} years old.`;
  }
  return null;
}

export type ReminderKind = "week_before" | "day_before";

/**
 * Which reminder is due today, if any.
 *
 *   week_before — 2 to 7 days out. A range rather than exactly 7 so a missed
 *                 run, or a birthday entered late, still gets its heads-up.
 *   day_before  — 1 day out, or on the day itself if yesterday's run was
 *                 missed.
 *
 * Each (child, birthday, kind) is sent at most once — see birthday_reminders.
 */
export function reminderDue(daysUntil: number): ReminderKind | null {
  if (daysUntil >= 2 && daysUntil <= 7) return "week_before";
  if (daysUntil === 0 || daysUntil === 1) return "day_before";
  return null;
}

/** "Saturday 12 October" — no year, which teachers don't need. */
export function formatBirthdayDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** "12 March" — a birthday's day and month only. */
export function formatDayMonth(dob: string): string {
  return new Date(`${dob}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** "today", "tomorrow", "in 5 days". */
export function whenLabel(daysUntil: number): string {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  return `in ${daysUntil} days`;
}

/**
 * The age to show for a child: worked out from their date of birth when we
 * have it (the stored age goes stale), otherwise the age given at sign-up.
 */
export function displayAge(
  s: { age: number | null; date_of_birth?: string | null },
  today: string = officeToday(),
): number | null {
  if (s.date_of_birth && isValidDate(s.date_of_birth)) return ageOn(s.date_of_birth, today);
  return s.age;
}

export type UpcomingBirthday = {
  studentId: string;
  name: string;
  date: string;
  daysUntil: number;
  turning: number;
};

/** Children whose birthday falls within the next `days` days (0 = today). */
export function upcomingBirthdays(
  students: Array<{
    id: string;
    full_name: string;
    preferred_name: string | null;
    date_of_birth: string | null;
  }>,
  today: string,
  days = 7,
): UpcomingBirthday[] {
  const out: UpcomingBirthday[] = [];
  for (const s of students) {
    if (!s.date_of_birth || !isValidDate(s.date_of_birth)) continue;
    const daysUntil = daysUntilBirthday(s.date_of_birth, today);
    if (daysUntil > days) continue;
    out.push({
      studentId: s.id,
      name: s.preferred_name ?? s.full_name,
      date: nextBirthday(s.date_of_birth, today),
      daysUntil,
      turning: turningAge(s.date_of_birth, today),
    });
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
}
