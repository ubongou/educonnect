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

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatSkillRating(rating: number): string {
  if (!Number.isFinite(rating)) return "—";
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return `${clamped}/5`;
}
