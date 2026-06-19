import Image from "next/image";
import clsx from "clsx";

type Mode = "on-blue" | "on-navy" | "on-white" | "on-yellow";

// Heights in px. Width scales from the source aspect (~6.4:1 for both assets
// after the blue logo was cropped to match the white one).
const sizes = {
  sm: 26,
  md: 34,
  lg: 44,
} as const;

// The approved wordmark files (from the client brand guide).
//   - logo-white.png: white wordmark on transparent — for dark backgrounds.
//   - logo-blue.png:  blue wordmark on transparent  — for light backgrounds.
const assets: Record<Mode, { src: string; w: number; h: number }> = {
  "on-blue": { src: "/brand/logo-white.png", w: 1452, h: 226 },
  "on-navy": { src: "/brand/logo-white.png", w: 1452, h: 226 },
  "on-yellow": { src: "/brand/logo-blue.png", w: 1536, h: 240 },
  "on-white": { src: "/brand/logo-blue.png", w: 1536, h: 240 },
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
      alt="masani"
      width={width}
      height={height}
      priority
      className={clsx("h-auto w-auto", className)}
      style={{ width, height }}
    />
  );
}
