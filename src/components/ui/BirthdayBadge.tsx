import { daysUntilBirthday, officeToday, turningAge, whenLabel } from "@/lib/birthdays";

/**
 * "🎂 Birthday today — turning 10" on a child's page, shown only in the week
 * before. Renders nothing otherwise, or when the birthday isn't known.
 */
export function BirthdayBadge({ dateOfBirth }: { dateOfBirth: string | null }) {
  if (!dateOfBirth) return null;
  const today = officeToday();
  const days = daysUntilBirthday(dateOfBirth, today);
  if (days > 7) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-yellow/60 bg-yellow/20 px-3 py-1 font-heading text-[12px] font-semibold text-navy">
      <span aria-hidden="true">🎂</span>
      Birthday {whenLabel(days)} — turning {turningAge(dateOfBirth, today)}
    </span>
  );
}
