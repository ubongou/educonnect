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
  "inline-flex items-center gap-2 rounded-pill border-2 border-navy font-heading font-bold leading-none transition-[transform,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  md: "text-[13px] px-6 py-[11px]",
  lg: "text-[15px] px-[30px] py-[14px]",
};

const variants = {
  primary: "bg-coral text-white",
  outline: "bg-transparent text-navy hover:bg-navy/5",
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
