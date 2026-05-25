import Link from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";

type CommonProps = {
  variant?: "primary" | "outline";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
};

type AnchorProps = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  type?: never;
  disabled?: never;
  onClick?: never;
};

type ButtonProps = CommonProps & {
  href?: undefined;
  target?: never;
  rel?: never;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

type Props = AnchorProps | ButtonProps;

const base =
  "inline-flex items-center gap-2 rounded-pill border border-transparent font-heading font-medium leading-none transition-[transform,box-shadow,background,border-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  md: "text-[13px] px-6 py-[11px]",
  lg: "text-[15px] px-[30px] py-[14px]",
};

const variants = {
  primary: "bg-coral text-white shadow-[0_8px_18px_-8px_rgba(255,105,63,0.55)] hover:bg-[#e85429]",
  outline: "border-[rgba(4,19,28,0.18)] bg-transparent text-navy hover:border-navy hover:bg-navy hover:text-white",
};

export function Button(props: Props) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = clsx(base, sizes[size], variants[variant], className);

  if ("href" in props && props.href) {
    const external = props.target === "_blank";
    return (
      <Link
        href={props.href}
        target={props.target}
        rel={external ? props.rel ?? "noopener noreferrer" : props.rel}
        className={cls}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={cls}
    >
      {children}
    </button>
  );
}
