import Link from "next/link";

type Tab = "overview" | "materials";

const TABS: { key: Tab; label: string; suffix: string }[] = [
  { key: "overview", label: "Overview", suffix: "" },
  { key: "materials", label: "Materials", suffix: "/materials" },
];

/**
 * Sub-navigation for a teacher's student detail. "Overview" holds reports,
 * parent documents, progress and intake; "Materials" holds the files the
 * teacher shares directly with the parent (ad-hoc, between-lesson sends).
 */
export function StudentTabsNav({
  id,
  active,
}: {
  id: string;
  active: Tab;
}) {
  return (
    <nav
      aria-label="Student sections"
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/teacher/students/${id}${t.suffix}`}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center rounded-pill border px-4 py-[7px] font-heading text-[13px] font-semibold transition-colors ${
              isActive
                ? "border-navy bg-navy text-yellow"
                : "border-navy/20 bg-white text-navy hover:bg-paper"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
