import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-yellow bg-dot-navy">
      <header className="px-7 py-6">
        <Link href="/" aria-label="EduConnect home" className="inline-block">
          <BrandLogo mode="on-yellow" size="md" />
        </Link>
      </header>

      <main className="flex items-start justify-center px-6 pb-20 pt-6 md:pt-12">
        <div className="w-full max-w-[440px] rounded-lg border-[1.5px] border-navy/10 bg-white p-8 shadow-[0_20px_50px_-24px_rgba(4,19,28,0.35)] md:p-10">
          <h1 className="font-heading text-[28px] font-extrabold leading-[1.15] text-navy">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[14px] leading-[1.6] text-g600">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-8 border-t border-g100 pt-5 text-center text-[13px] text-g600">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
