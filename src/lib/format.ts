export function formatRegistrationNumber(raw: string): string {
  if (!/^EC-\d{4}-\d{5}$/.test(raw)) return raw;
  return raw;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(iso: string | Date): string {
  // A date-only string (e.g. a Postgres `date` like lesson_date) parses as UTC
  // midnight. Format it in UTC so the calendar day never shifts for viewers
  // west of UTC — a lesson on the 1st must not read as the 30th for a diaspora
  // parent in the US. Full timestamps / Date instances keep local formatting.
  const dateOnly = typeof iso === "string" && DATE_ONLY_RE.test(iso);
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSkillRating(rating: number): string {
  if (!Number.isFinite(rating)) return "—";
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return `${clamped}/5`;
}
