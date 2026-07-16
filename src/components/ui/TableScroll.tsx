"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scrollable card wrapper for wide tables.
 *
 * Every table card used to be a plain `overflow-hidden` div, which clipped the
 * rounded corners — and, once the table outgrew the viewport, silently ate the
 * trailing columns with no scrollbar to get them back. Here the card still
 * clips corners, but an inner scroller owns the horizontal axis, and the
 * `minWidth` floor stops columns squishing into unreadable slivers before the
 * scroll kicks in.
 *
 * Fades mark the edges that have more content off-screen — macOS keeps
 * scrollbars hidden until you scroll, so without them the extra columns are
 * reachable but easy to miss.
 */
export function TableScroll({
  children,
  minWidth = 720,
  className = "overflow-hidden rounded-2xl border border-line bg-white",
}: {
  children: ReactNode;
  /** Width below which the table scrolls instead of squishing. */
  minWidth?: number;
  /** The card shell. Override for a different radius, or a bare inner section. */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px slack: fractional layout widths never land exactly on the bounds.
    setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    // Catches viewport resizes and late-arriving content alike.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync]);

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} className="overflow-x-auto">
        <div style={{ minWidth }}>{children}</div>
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-navy/10 to-transparent transition-opacity duration-200 ${
          edges.start ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-navy/10 to-transparent transition-opacity duration-200 ${
          edges.end ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
