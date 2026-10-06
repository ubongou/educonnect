import Link from "next/link";
import { formatBirthdayDay, whenLabel, type UpcomingBirthday } from "@/lib/birthdays";

/** The next seven days' birthdays, soonest first. Day and age only — no year. */
export function BirthdaysThisWeek({
  birthdays,
  hrefFor,
}: {
  birthdays: UpcomingBirthday[];
  hrefFor: (studentId: string) => string;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
        Birthdays this week
      </h2>
      {birthdays.length === 0 ? (
        <p className="rounded-[28px] border border-dashed border-line bg-white px-5 py-4 text-[14px] text-g600">
          No birthdays in the next seven days.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-[28px] border border-line bg-white">
          {birthdays.map((b) => (
            <li key={b.studentId}>
              <Link
                href={hrefFor(b.studentId)}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[14px] hover:bg-paper"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">🎂</span>
                  <span className="font-heading font-semibold text-navy">{b.name}</span>
                  <span className="text-g600">turns {b.turning}</span>
                </span>
                <span className={b.daysUntil <= 1 ? "font-semibold text-coral" : "text-g600"}>
                  {formatBirthdayDay(b.date)} · {whenLabel(b.daysUntil)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
