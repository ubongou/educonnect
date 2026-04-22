import Link from "next/link";
import clsx from "clsx";

export type ChildTabOption = {
  id: string;
  label: string;
  dotColor?: string;
};

/**
 * Chip-tab selector used across the new parent IA (Overview / Sessions /
 * Documents / Account). Each tab is a server-rendered <Link> that updates
 * `?child=<id>` so the whole page re-renders server-side for the selected
 * child — no client JS, cheap navigation.
 */
export function ChildTabs({
  basePath,
  children,
  activeId,
}: {
  basePath: string;
  children: ChildTabOption[];
  activeId: string | null;
}) {
  if (children.length <= 1) return null;

  return (
    <nav
      aria-label="Select child"
      className="mb-8 flex flex-wrap items-center gap-2"
    >
      {children.map((c) => {
        const active = c.id === activeId;
        const href = `${basePath}?child=${c.id}`;
        return (
          <Link
            key={c.id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "inline-flex items-center gap-2 rounded-pill border-[1.5px] px-4 py-[7px] font-heading text-[13px] font-semibold transition-colors",
              active
                ? "border-navy bg-navy text-yellow"
                : "border-navy/20 bg-white text-navy hover:bg-g50",
            )}
          >
            {c.dotColor && (
              <span
                className="h-2 w-2 rounded-pill"
                style={{ backgroundColor: c.dotColor }}
              />
            )}
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}
