/**
 * Filter + pagination vocabulary for the admin sessions list.
 *
 * Sessions are date-only (migrations 0019/0020), so every bound here is a
 * YYYY-MM-DD calendar day and every comparison is lexicographic — correct for
 * that fixed-width format and free of timezone drift. All maths runs in UTC to
 * match the rest of the app, which derives "today" from
 * `new Date().toISOString().slice(0, 10)`.
 *
 * Kept free of React and Supabase so the range arithmetic can be unit-tested
 * directly — the page itself can't be exercised locally (no Supabase creds).
 */

export const SESSION_PAGE_SIZE = 50;

export const DATE_PRESETS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last30", label: "Last 30 days" },
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

export const SESSION_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function isDatePreset(v: string | undefined): v is DatePreset {
  return DATE_PRESETS.some((p) => p.value === v);
}

export function isSessionStatus(v: string | undefined): boolean {
  return SESSION_STATUS_OPTIONS.some((s) => s.value === v);
}

/** Inclusive calendar-day bounds. An absent bound means unbounded that way. */
export type DateRange = { from?: string; to?: string };

function shiftDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + delta * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `day`. */
function startOfWeek(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
  return shiftDays(day, dow === 0 ? -6 : 1 - dow);
}

/**
 * Resolves a preset to concrete bounds against `today` (a YYYY-MM-DD day).
 *
 * "Upcoming" and "past" split on today itself: today's sessions count as
 * upcoming, because a session scheduled for today hasn't necessarily happened.
 */
export function dateRangeFor(preset: DatePreset, today: string): DateRange {
  switch (preset) {
    case "upcoming":
      return { from: today };
    case "past":
      return { to: shiftDays(today, -1) };
    case "week": {
      const from = startOfWeek(today);
      return { from, to: shiftDays(from, 6) };
    }
    case "month": {
      const [y, m] = today.split("-");
      const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
      return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, "0")}` };
    }
    case "last30":
      return { from: shiftDays(today, -30), to: today };
    case "all":
      return {};
  }
}

/**
 * Sort direction for a preset. Forward-looking views read soonest-first;
 * everything historical reads newest-first, so the most recent lesson is at
 * the top rather than buried pages deep.
 */
export function ascendingFor(preset: DatePreset): boolean {
  return preset === "upcoming" || preset === "week" || preset === "month";
}

export type SessionFilterState = {
  student: string | null;
  teacher: string | null;
  subject: string | null;
  status: string | null;
  range: DatePreset;
  page: number;
};

/**
 * Normalises raw `searchParams` into a filter state. Unknown or malformed
 * values fall back to defaults rather than erroring — a hand-edited URL should
 * degrade to the default view, not a crash.
 */
export function parseSessionFilters(sp: {
  student?: string;
  teacher?: string;
  subject?: string;
  status?: string;
  range?: string;
  page?: string;
}): SessionFilterState {
  const page = Number(sp.page);
  return {
    student: sp.student || null,
    teacher: sp.teacher || null,
    subject: sp.subject || null,
    status: isSessionStatus(sp.status) ? sp.status! : null,
    range: isDatePreset(sp.range) ? sp.range : "upcoming",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Serialises filter state back into a query string (omitting defaults). */
export function sessionFiltersToQuery(
  state: Partial<SessionFilterState>,
): string {
  const params = new URLSearchParams();
  if (state.student) params.set("student", state.student);
  if (state.teacher) params.set("teacher", state.teacher);
  if (state.subject) params.set("subject", state.subject);
  if (state.status) params.set("status", state.status);
  if (state.range && state.range !== "upcoming") params.set("range", state.range);
  if (state.page && state.page > 1) params.set("page", String(state.page));
  const q = params.toString();
  return q ? `?${q}` : "";
}

/** Zero-based [start, end] row indexes for a page, as PostgREST `.range()` wants. */
export function pageRange(page: number, size = SESSION_PAGE_SIZE): [number, number] {
  const start = (page - 1) * size;
  return [start, start + size - 1];
}

export function totalPages(count: number, size = SESSION_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / size));
}

/**
 * A session may be hard-deleted only when it carries no lesson report and was
 * never marked completed. Cancelled and no-show rows are fair game — they're
 * scheduling noise, not delivery records. Enforced server-side in
 * `deleteSession` / `deleteSessionsBulk`; this predicate keeps the UI in step.
 */
export function isDeletableSession(s: {
  status: string;
  lesson_report_id: string | null;
}): boolean {
  return s.lesson_report_id === null && s.status !== "completed";
}
