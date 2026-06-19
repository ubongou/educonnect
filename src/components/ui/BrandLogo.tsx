import Image from "next/image";
import clsx from "clsx";

type Mode = "on-blue" | "on-navy" | "on-white" | "on-yellow";

// Heights in px. Width scales from each asset's source aspect ratio.
const sizes = {
  sm: 26,
  md: 34,
  lg: 44,
} as const;

// The approved Masani wordmark files.
//   - logo-blue-bg.png:  baked onto the brand's sky-blue (#3EBEFF) — for
//     surfaces that are exactly that blue (nav pill, dashboard header).
//   - logo-navy-bg.png:  baked onto the brand's navy (#04131C) — for dark
//     navy surfaces (authed footer).
//   - logo-transparent.png: transparent background, blue wordmark — for
//     light surfaces that aren't the exact brand blue (cream, white, yellow).
const assets: Record<Mode, { src: string; w: number; h: number }> = {
  "on-blue": { src: "/brand/logo-blue-bg.png", w: 1800, h: 323 },
  "on-navy": { src: "/brand/logo-navy-bg.png", w: 1800, h: 323 },
  "on-yellow": { src: "/brand/logo-transparent.png", w: 1400, h: 233 },
  "on-white": { src: "/brand/logo-transparent.png", w: 1400, h: 233 },
};

export function BrandLogo({
  mode = "on-blue",
  size = "md",
  className,
}: {
  mode?: Mode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { src, w, h } = assets[mode];
  const height = sizes[size];
  const width = Math.round(height * (w / h));

  return (
    <Image
      src={src}
      alt="Masani"
      width={width}
      height={height}
      priority
      className={clsx("h-auto w-auto", className)}
      style={{ width, height }}
    />
  );
}
