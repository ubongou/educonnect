import type { CSSProperties } from "react";

export type LineSeries = {
  label: string;
  color: string; // any valid CSS color; brand tokens: var(--color-coral) etc.
  points: Array<number | null>;
};

type Props = {
  series: LineSeries[];
  xLabels: string[];
  yLabels: string[]; // bottom-to-top (yLabels[0] = minimum)
  height?: number;
  /**
   * Min/max numeric range the y-axis should span. Defaults to 1..N (one-indexed
   * categorical scale) if not supplied.
   */
  yMin?: number;
  yMax?: number;
  yAxisWidth?: number;
  caption?: string;
};

/**
 * Native-SVG line chart. Re-implementation of the inspiration's
 * drawLineChart helper (docs/reference/educonnect_dashboard_v4.html:401)
 * as a React server component: gridlines, y-axis labels stacked
 * bottom-to-top, one polyline + circle-dots per series. Zero JS on the
 * client — the chart is pre-rendered SVG.
 *
 * `points` may contain nulls (e.g., a subject with no data yet); nulls are
 * skipped without breaking the polyline.
 */
export function LineChart({
  series,
  xLabels,
  yLabels,
  height = 132,
  yMin,
  yMax,
  yAxisWidth = 88,
  caption,
}: Props) {
  const min = yMin ?? 1;
  const max = yMax ?? yLabels.length;
  const span = Math.max(max - min, 1);
  const n = xLabels.length;

  const yAxisStyle: CSSProperties = { width: `${yAxisWidth}px` };
  const xAxisStyle: CSSProperties = { paddingLeft: `${yAxisWidth}px` };

  return (
    <div className="flex flex-col gap-2">
      {caption && <p className="text-[11px] text-g400">{caption}</p>}
      <div className="flex">
        {/* y-axis labels — top → bottom */}
        <div
          className="flex flex-col items-end pr-2 text-[10px] text-g600"
          style={yAxisStyle}
        >
          {[...yLabels].reverse().map((label, i) => (
            <div
              key={`${label}-${i}`}
              className="flex items-center justify-end leading-tight"
              style={{ height: `${height / yLabels.length}px` }}
            >
              {label}
            </div>
          ))}
        </div>
        {/* chart area */}
        <div className="relative flex-1" style={{ height }}>
          {/* horizontal gridlines, one per y label */}
          <div className="absolute inset-0">
            {yLabels.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-navy/5"
                style={{ top: `${(i / yLabels.length) * 100}%` }}
              />
            ))}
          </div>

          {/*
            Two overlaid SVGs. The line uses a 0..100 × 0..height viewBox with
            preserveAspectRatio="none" so it stretches to the responsive width
            (SVG <polyline points> can't use "%" units — that was the source of
            the "Expected number" console error). The dots live in a separate
            pixel-space SVG using cx="…%" so they stay perfectly round rather
            than being stretched by the non-uniform viewBox scale.
          */}
          <svg
            className="absolute inset-0"
            style={{ width: "100%", height }}
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {series.map((s, ci) => {
              const entries = s.points
                .map((v, i) => ({ v, i }))
                .filter(
                  (e): e is { v: number; i: number } =>
                    typeof e.v === "number" && Number.isFinite(e.v),
                );
              if (entries.length === 0) return null;

              const pts = entries
                .map(({ v, i }) => {
                  const x = ((i + 0.5) / n) * 100;
                  const norm = (v - min) / span;
                  const y = (1 - norm) * height;
                  return `${x.toFixed(2)},${y.toFixed(2)}`;
                })
                .join(" ");

              return (
                <polyline
                  key={ci}
                  points={pts}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                />
              );
            })}
          </svg>
          <svg
            className="absolute inset-0"
            style={{ width: "100%", height }}
            aria-hidden="true"
          >
            {series.map((s, ci) => {
              const entries = s.points
                .map((v, i) => ({ v, i }))
                .filter(
                  (e): e is { v: number; i: number } =>
                    typeof e.v === "number" && Number.isFinite(e.v),
                );
              if (entries.length === 0) return null;

              return (
                <g key={ci} opacity={0.9}>
                  {entries.map(({ v, i }) => {
                    const cx = `${(((i + 0.5) / n) * 100).toFixed(2)}%`;
                    const norm = (v - min) / span;
                    const cy = (1 - norm) * height;
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={s.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {/* x-axis labels — angled 45° so dense date labels don't collide */}
      <div className="flex" style={xAxisStyle}>
        {xLabels.map((lbl, i) => (
          <div
            key={`${lbl}-${i}`}
            className="flex min-h-[34px] flex-1 justify-center"
          >
            <span className="mt-1 inline-block -rotate-45 whitespace-nowrap text-[9px] leading-none text-g400">
              {lbl}
            </span>
          </div>
        ))}
      </div>
      {/* legend */}
      {series.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {series.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-2 text-[12px] text-g600"
            >
              <span
                className="block h-[3px] w-4 rounded-pill"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
