import Image from "next/image";
import clsx from "clsx";

type Mode = "on-blue" | "on-navy" | "on-white" | "on-yellow";

const sizes = {
  sm: { w: 110, h: 36 },
  md: { w: 140, h: 46 },
  lg: { w: 180, h: 60 },
} as const;

/**
 * EduConnect wordmark.
 *
 * The source asset (`/brand/wordmark.png`) is a white-on-transparent PNG, so
 * we render it directly with <Image> on dark backgrounds (blue/navy) and use
 * a CSS `mask-image` trick on light backgrounds (yellow/white) to tint the
 * wordmark into brand navy without needing a second asset.
 */
export function BrandLogo({
  mode = "on-blue",
  size = "md",
  className,
}: {
  mode?: Mode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { w, h } = sizes[size];
  const onDark = mode === "on-blue" || mode === "on-navy";

  if (onDark) {
    return (
      <Image
        src="/brand/wordmark.png"
        alt="EduConnect"
        width={w}
        height={h}
        priority
        className={clsx("h-auto w-auto", className)}
        style={{ width: w, height: h }}
      />
    );
  }

  // Tint the wordmark into brand navy via alpha-as-mask.
  return (
    <span
      role="img"
      aria-label="EduConnect"
      className={clsx("inline-block shrink-0 bg-navy", className)}
      style={{
        width: w,
        height: h,
        WebkitMaskImage: "url(/brand/wordmark.png)",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: "url(/brand/wordmark.png)",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
    />
  );
}
