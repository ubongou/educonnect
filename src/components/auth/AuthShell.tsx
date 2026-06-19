import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Footer } from "@/components/ui/Footer";

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
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="px-7 py-6">
        <Link href="/" aria-label="Masani home" className="inline-block">
          <BrandLogo mode="on-white" size="md" />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-20 pt-6 md:pt-12">
        <div className="w-full max-w-[440px] rounded-[28px] border border-line bg-white p-8 shadow-[0_6px_18px_-8px_rgba(4,19,28,0.18),0_24px_60px_-30px_rgba(4,19,28,0.25)] md:p-10">
          <h1 className="font-heading text-[clamp(28px,4vw,36px)] font-semibold leading-[1.05] tracking-[-0.02em] text-navy">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[14px] leading-[1.6] text-g600">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-8 border-t border-line pt-5 text-center text-[13px] text-g600">
              {footer}
            </div>
          )}
        </div>
      </main>

      <div className="mkt-root">
        <Footer mode="marketing" />
      </div>
    </div>
  );
}
