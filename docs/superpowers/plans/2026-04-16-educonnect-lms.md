# EduConnect LMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the minimal MVP of EduConnect LMS — a Next.js 15 + Supabase school management system where parents self-signup with child details, request subject enrollments, and view uploaded results, while admins manage students, subjects, enrollments, and results.

**Architecture:** Next.js 15 App Router with `src/` layout and route groups; Supabase (Postgres + Auth + Storage + RLS) accessed via `@supabase/ssr` on server and browser; Tailwind CSS with theme tokens (navy/blue/yellow/coral, Nunito fonts) ported from the existing `index.html` / `pricing.html`; server actions for all mutations with zod validation; middleware enforces role-based route guards.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase (cloud + local CLI), `@supabase/ssr`, `@supabase/supabase-js`, Zod, Vitest, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-04-16-educonnect-lms-design.md`

---

## File Structure

This lists what each file is responsible for. Paths are relative to repo root.

**Config / tooling**
- `educonnect-lms/package.json` — scripts and deps
- `educonnect-lms/tsconfig.json` — TS compiler config
- `educonnect-lms/next.config.ts` — Next config
- `educonnect-lms/tailwind.config.ts` — theme tokens, keyframes, animations
- `educonnect-lms/postcss.config.mjs` — Tailwind + autoprefixer
- `educonnect-lms/eslint.config.mjs` — lint rules
- `educonnect-lms/.env.local.example` — documented env var template
- `educonnect-lms/middleware.ts` — session refresh + route guards
- `educonnect-lms/vitest.config.ts` — unit test runner
- `educonnect-lms/playwright.config.ts` — smoke test runner
- `educonnect-lms/CLAUDE.md` — project docs

**App entry**
- `educonnect-lms/src/app/layout.tsx` — root layout, fonts, metadata
- `educonnect-lms/src/app/globals.css` — resets + body/heading fonts + dot-pattern utilities
- `educonnect-lms/src/app/not-found.tsx`, `error.tsx` — themed fallbacks

**Marketing routes**
- `educonnect-lms/src/app/page.tsx` — home
- `educonnect-lms/src/app/pricing/page.tsx` — pricing
- `educonnect-lms/src/components/marketing/*` — Hero, IntroStrip, WhyGrid, HowItWorks, Testimonials, FoundersAbout, FinalCta, Contact, PricingTable, CurrencyToggle

**Auth routes**
- `educonnect-lms/src/app/login/page.tsx`
- `educonnect-lms/src/app/signup/page.tsx`
- `educonnect-lms/src/app/forgot-password/page.tsx`
- `educonnect-lms/src/app/onboarding/page.tsx` — intake form (gated)

**Authed parent app (`(authed)/dashboard`)**
- `educonnect-lms/src/app/(authed)/dashboard/layout.tsx` — `requireParent()` + `requireOnboardingComplete()` + authed `<Nav/>`
- `educonnect-lms/src/app/(authed)/dashboard/page.tsx` — children cards
- `educonnect-lms/src/app/(authed)/dashboard/children/new/page.tsx` — reuses the intake form
- `educonnect-lms/src/app/(authed)/dashboard/children/[id]/page.tsx` — profile + tabs (subjects, reports)
- `educonnect-lms/src/app/(authed)/dashboard/children/[id]/enroll/page.tsx`
- `educonnect-lms/src/app/(authed)/dashboard/children/[id]/reports/[reportId]/page.tsx` — full lesson report
- `educonnect-lms/src/app/(authed)/dashboard/settings/page.tsx`

**Authed admin app (`(authed)/admin`)**
- `educonnect-lms/src/app/(authed)/admin/layout.tsx` — `requireAdmin()`
- `educonnect-lms/src/app/(authed)/admin/page.tsx` — overview
- `educonnect-lms/src/app/(authed)/admin/students/page.tsx`
- `educonnect-lms/src/app/(authed)/admin/students/[id]/page.tsx`
- `educonnect-lms/src/app/(authed)/admin/enrollments/page.tsx`
- `educonnect-lms/src/app/(authed)/admin/subjects/page.tsx`
- `educonnect-lms/src/app/(authed)/admin/reports/page.tsx` — list with filters + retry-email action
- `educonnect-lms/src/app/(authed)/admin/reports/new/page.tsx` — compose lesson report

**API**
- `educonnect-lms/src/app/api/intake-files/[id]/download/route.ts` — signed-URL issuer for intake attachments

**UI primitives**
- `educonnect-lms/src/components/ui/Button.tsx`
- `educonnect-lms/src/components/ui/Container.tsx`
- `educonnect-lms/src/components/ui/Nav.tsx`
- `educonnect-lms/src/components/ui/Footer.tsx`
- `educonnect-lms/src/components/ui/Eyebrow.tsx`
- `educonnect-lms/src/components/ui/SectionHeader.tsx`
- `educonnect-lms/src/components/ui/Card.tsx`
- `educonnect-lms/src/components/ui/IntersectionFade.tsx`
- `educonnect-lms/src/components/ui/FormField.tsx` — label + input wrapper with error slot
- `educonnect-lms/src/components/ui/ChipGroup.tsx` — multi-select chip buttons
- `educonnect-lms/src/components/ui/BatteryBars.tsx` — 0–5 battery visual; editable or read-only mode

**Intake form**
- `educonnect-lms/src/components/intake/IntakeForm.tsx` — composes the 8 sections into a long form
- `educonnect-lms/src/components/intake/sections/{ChildInfo,LearningBackground,Strengths,Challenges,Motivation,Behaviour,Personality,Goals}Section.tsx`

**Admin lesson-report form**
- `educonnect-lms/src/components/admin/reports/{ReportHeaderFields,UnderstandingConfidence,LessonNotes,LearningBehaviours,SkillTracker,ReportSummary}.tsx`
- `educonnect-lms/src/components/admin/reports/ReportForm.tsx` — composes them; fetches skills for the selected subject

**Lib**
- `educonnect-lms/src/lib/supabase/browser.ts`
- `educonnect-lms/src/lib/supabase/server.ts`
- `educonnect-lms/src/lib/supabase/middleware.ts`
- `educonnect-lms/src/lib/auth.ts` — `getUser`, `getProfile`, `requireParent`, `requireAdmin`, `requireOnboardingComplete`
- `educonnect-lms/src/lib/validation.ts` — zod schemas (signup, intake sections, enrollment, lesson report)
- `educonnect-lms/src/lib/format.ts` — date, duration, registration-number, currency helpers
- `educonnect-lms/src/lib/email.ts` — Resend client + lesson-report email template
- `educonnect-lms/src/lib/actions/{signup,onboarding,children,enrollments,subjects,reports,profile}.ts`

**Types**
- `educonnect-lms/src/types/db.ts` — generated by `supabase gen types`

**Supabase**
- `educonnect-lms/supabase/config.toml`
- `educonnect-lms/supabase/migrations/0001_init.sql` — tables + profile trigger + `next_registration_number()` + sequence
- `educonnect-lms/supabase/migrations/0002_rls.sql`
- `educonnect-lms/supabase/migrations/0003_storage.sql` — `intake-files` bucket + policies
- `educonnect-lms/supabase/migrations/0004_rpc_create_student.sql` — atomic: student + parent_students + intake_files + reg no
- `educonnect-lms/supabase/migrations/0005_rpc_create_lesson_report.sql` — atomic: report + skill ratings
- `educonnect-lms/supabase/seed.sql` — subjects + subject_skills (Math / English / Science)

**Tests**
- `educonnect-lms/src/lib/__tests__/validation.test.ts`
- `educonnect-lms/src/lib/__tests__/format.test.ts`
- `educonnect-lms/src/lib/__tests__/email.test.ts` — template rendering
- `educonnect-lms/tests/e2e/signup-onboarding.spec.ts`
- `educonnect-lms/tests/rls/parent-isolation.test.ts`

---

## Conventions

- **Working directory for commands:** `educonnect-lms/` unless stated. All `cd` assumed.
- **Commit style:** short imperative subject, no trailers, no "generated by" footers. Examples: `scaffold next.js project`, `add theme tokens and fonts`, `port marketing home page`.
- **Tests first** where a pure function or schema is being built. Infrastructure tasks (migrations, scaffolding) don't need TDD but must verify outcomes via explicit commands with expected output.
- **Each task ends with a commit** so the branch stays green.
- **RLS is the source of truth** for authorization. Server actions rely on user-scoped Supabase clients; the service role key is only used by the download route handler after explicit verification.

---

## Task 1: Scaffold Next.js 15 project

**Files:**
- Create: `educonnect-lms/package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

The existing `educonnect-lms/` directory currently holds only `index.html`, `pricing.html`, and `docs/`. Scaffold into this same directory.

- [ ] **Step 1: Move the two reference HTML files into `docs/reference/`**

```bash
cd educonnect-lms
mkdir -p docs/reference
git mv index.html docs/reference/index.html
git mv pricing.html docs/reference/pricing.html
```

Expected: `git status` shows both files renamed.

- [ ] **Step 2: Run the Next scaffold inside the directory**

Run from repo root:

```bash
cd educonnect-lms
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --no-install
```

Answer "Yes" to `--yes` prompts if presented. `--no-install` lets us skip the install until deps are settled.

Expected: new files including `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `package.json`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`. The `docs/` directory is left untouched.

- [ ] **Step 3: Install deps**

```bash
cd educonnect-lms
npm install
```

Expected: `node_modules/` populated, `package-lock.json` created.

- [ ] **Step 4: Verify the scaffold boots**

```bash
npm run dev
```

Expected: server starts at `http://localhost:3000`, default Next landing page renders. Stop with Ctrl-C.

- [ ] **Step 5: Add `.env.local.example`**

Create `educonnect-lms/.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 6: Commit**

```bash
cd educonnect-lms
git add .
git commit -m "scaffold next.js 15 app with tailwind and typescript"
```

---

## Task 2: Install project dependencies

**Files:** `educonnect-lms/package.json` (modified)

- [ ] **Step 1: Install runtime deps**

```bash
cd educonnect-lms
npm install @supabase/supabase-js @supabase/ssr zod clsx
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitest/ui @testing-library/jest-dom @playwright/test supabase
npx playwright install --with-deps chromium
```

- [ ] **Step 3: Add scripts to `package.json`**

Replace the `"scripts"` section with:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:start": "supabase start",
  "db:stop": "supabase stop",
  "db:reset": "supabase db reset",
  "db:push": "supabase db push",
  "db:types": "supabase gen types typescript --local > src/types/db.ts"
}
```

- [ ] **Step 4: Verify**

```bash
npm run lint
```

Expected: passes (no lint errors on scaffold files).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "add runtime and dev dependencies"
```

---

## Task 3: Configure Tailwind theme tokens

**Files:**
- Modify: `educonnect-lms/tailwind.config.ts`
- Modify: `educonnect-lms/src/app/layout.tsx`
- Modify: `educonnect-lms/src/app/globals.css`

- [ ] **Step 1: Replace `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy:   "#04131C",  // Midnight Navy
        blue:   "#3EBEFF",  // Sky Blue
        yellow: "#FCB936",  // Sunrise Yellow
        coral:  "#FF693F",  // Vibrant Coral
        cyan:   "#42DBFD",  // Fresh Cyan (supporting)
        g50:    "#F8F7F5",
        g100:   "#EEECEA",
        g400:   "#999999",
        g600:   "#555555",
      },
      borderRadius: {
        pill: "100px",
        lg:   "16px",
        md:   "10px",
      },
      fontFamily: {
        heading: ["var(--font-nunito)", "sans-serif"],
        sans:    ["var(--font-nunito-sans)", "sans-serif"],
      },
      maxWidth: {
        container: "1100px",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float:     "float 4s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease both",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Load Nunito fonts in `src/app/layout.tsx`**

Replace file with:

```tsx
import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduConnect | Personal Tutoring from Nigeria's Best Teachers",
  description:
    "EduConnect — Personal Tutoring from Nigeria's Best Teachers. One-on-one sessions in Maths, English, and Science. Backed by MIT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${nunitoSans.variable}`}>
      <body className="font-sans text-navy bg-white antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

@theme inline {
  --color-navy: #04131C;
  --color-blue: #3EBEFF;
  --color-yellow: #FCB936;
  --color-coral: #FF693F;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
img { display: block; max-width: 100%; }
a { text-decoration: none; color: inherit; }
h1, h2, h3, h4 { font-family: var(--font-nunito), sans-serif; }
body { font-family: var(--font-nunito-sans), sans-serif; }

.bg-dot-navy {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2304131C' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E");
}

.bg-dot-blue {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233EBEFF' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E");
}
```

- [ ] **Step 4: Replace `src/app/page.tsx` with a temporary placeholder using the tokens**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-yellow">
      <h1 className="font-heading text-4xl font-extrabold text-navy">
        EduConnect
      </h1>
    </main>
  );
}
```

- [ ] **Step 5: Verify the theme renders**

```bash
npm run dev
```

Expected: yellow background, navy Nunito heading "EduConnect" at `http://localhost:3000`. Stop server.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/app/layout.tsx src/app/globals.css src/app/page.tsx
git commit -m "configure tailwind theme tokens and nunito fonts"
```


---

## Task 4: Shared UI primitives

**Files:**
- Create: `src/components/ui/Container.tsx`, `Button.tsx`, `Eyebrow.tsx`, `SectionHeader.tsx`, `Card.tsx`, `IntersectionFade.tsx`, `FormField.tsx`, `ChipGroup.tsx`, `BatteryBars.tsx`, `Nav.tsx`, `Footer.tsx`

- [ ] **Step 1: `Container.tsx`**

```tsx
import { ReactNode } from "react";
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-container mx-auto px-10 ${className}`}>{children}</div>;
}
```

- [ ] **Step 2: `Button.tsx`**

```tsx
import Link from "next/link";
import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  href?: string;
  target?: string;
  variant?: "primary" | "outline";
  size?: "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

export function Button({ href, target, variant = "primary", size = "md", type = "button", disabled, onClick, children, className }: Props) {
  const base = "inline-flex items-center gap-2 rounded-pill font-heading font-bold border-2 border-navy leading-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:pointer-events-none";
  const sz = size === "lg" ? "text-[15px] px-[30px] py-[14px]" : "text-[13px] px-6 py-[11px]";
  const styles = variant === "outline" ? "bg-transparent text-navy hover:bg-navy/5" : "bg-coral text-white";
  const cls = clsx(base, sz, styles, className);
  if (href) return <Link href={href} target={target} className={cls}>{children}</Link>;
  return <button type={type} disabled={disabled} onClick={onClick} className={cls}>{children}</button>;
}
```

- [ ] **Step 3: `Eyebrow.tsx` + `SectionHeader.tsx`**

```tsx
// Eyebrow.tsx
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[11px] font-bold uppercase tracking-[0.12em] text-blue mb-3 block ${className}`}>{children}</span>;
}
```

```tsx
// SectionHeader.tsx
export function SectionHeader({ eyebrow, title, subtitle, light = false }: { eyebrow?: string; title: string; subtitle?: string; light?: boolean }) {
  const titleColor = light ? "text-white" : "text-navy";
  const subColor  = light ? "text-white/55" : "text-g600";
  return (
    <div className="mb-[52px]">
      {eyebrow && <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue mb-3 block">{eyebrow}</span>}
      <h2 className={`font-heading font-extrabold leading-[1.15] text-[clamp(26px,3.5vw,40px)] ${titleColor} mb-3`}>{title}</h2>
      {subtitle && <p className={`text-base leading-[1.75] max-w-[520px] ${subColor}`}>{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 4: `Card.tsx`**

```tsx
import { ReactNode } from "react";
import clsx from "clsx";
export function Card({ children, className = "", variant = "light" }: { children: ReactNode; className?: string; variant?: "light" | "dark" | "dark-yellow-border" }) {
  const base = "rounded-lg p-7 transition-[transform,box-shadow] duration-200 ease-out";
  const map = {
    "light": "bg-white border-[1.5px] border-g100",
    "dark": "bg-navy border border-white/10",
    "dark-yellow-border": "bg-navy border-[1.5px] border-yellow",
  } as const;
  return <div className={clsx(base, map[variant], className)}>{children}</div>;
}
```

- [ ] **Step 5: `IntersectionFade.tsx` (client)**

```tsx
"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function IntersectionFade({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={clsx("transition-[opacity,transform] duration-[600ms] ease-out will-change-[opacity,transform]", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6", className)}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: `FormField.tsx`, `ChipGroup.tsx`, `BatteryBars.tsx`**

```tsx
// FormField.tsx
import { ReactNode } from "react";
export function FormField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[7px]">
      <span className="font-heading text-[13px] font-semibold text-navy">{label}</span>
      {hint && <span className="text-[12px] text-g400">{hint}</span>}
      {children}
      {error && <span className="text-[12px] text-coral">{error}</span>}
    </label>
  );
}
```

```tsx
// ChipGroup.tsx
"use client";
import clsx from "clsx";
type Option = { value: string; label: string };
export function ChipGroup({ name, options, value, onChange, multi = true }: {
  name: string; options: Option[]; value: string[]; onChange: (next: string[]) => void; multi?: boolean;
}) {
  const toggle = (v: string) => {
    if (multi) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else onChange([v]);
  };
  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={clsx(
            "rounded-pill border-[1.5px] px-4 py-2 text-[13px] font-semibold transition-colors",
            value.includes(o.value) ? "border-navy bg-navy text-white" : "border-g100 bg-white text-navy hover:border-navy",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

```tsx
// BatteryBars.tsx
"use client";
import clsx from "clsx";
export function BatteryBars({ value, onChange, readOnly = false, label }: { value: number; onChange?: (n: number) => void; readOnly?: boolean; label?: string }) {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-3">
      {label && <span className="min-w-[160px] text-[14px] text-navy">{label}</span>}
      <div className="flex gap-1">
        {bars.map((b) => {
          const filled = b <= value;
          const clickable = !readOnly && onChange;
          return (
            <button
              key={b}
              type="button"
              disabled={readOnly}
              onClick={clickable ? () => onChange!(b) : undefined}
              className={clsx(
                "h-5 w-8 rounded-[4px] border-[1.5px] border-navy transition-colors",
                filled ? "bg-yellow" : "bg-white",
                !readOnly && "hover:brightness-95",
              )}
              aria-label={`Set rating to ${b}`}
            />
          );
        })}
      </div>
      <span className="ml-2 text-[13px] font-bold text-navy tabular-nums">{value}/5</span>
    </div>
  );
}
```

- [ ] **Step 7: `Nav.tsx` + `Footer.tsx`**

Use `docs/reference/index.html` as the visual source of truth. `Nav` takes `mode: "marketing" | "authed"` and optional `activeHref`. `Footer` same modes. Implement the yellow sticky bar with blue pill, hamburger menu, mobile sheet exactly as in the reference. Both should compose `<Container/>` and `<Button/>`.

- [ ] **Step 8: Verify with `npm run dev`**

Put `<Nav mode="marketing"/>` and `<Footer mode="marketing"/>` on the placeholder `page.tsx` temporarily to confirm the yellow bar + blue pill render correctly at desktop and mobile widths.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui
git commit -m "add shared ui primitives"
```

---

## Task 5: Port marketing home page

**Files:**
- Create: `src/components/marketing/Hero.tsx`, `IntroStrip.tsx`, `WhyGrid.tsx`, `HowItWorks.tsx`, `Testimonials.tsx`, `FoundersAbout.tsx`, `FinalCta.tsx`, `Contact.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build each marketing component**

Use `docs/reference/index.html` as the exact source. Preserve copy, MIT badge, bubble animations (`animate-float`), stat strip, card borders, testimonial opening quote glyph, founders bio cards, contact form layout. Replace inline CSS with Tailwind utilities that map to the theme tokens. Wrap fade-in sections in `<IntersectionFade delay={...}/>`. Contact form posts to a local server action for now that logs to `console.log` (email wiring is a later task).

- [ ] **Step 2: Compose in `src/app/page.tsx`**

```tsx
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Hero } from "@/components/marketing/Hero";
import { IntroStrip } from "@/components/marketing/IntroStrip";
import { WhyGrid } from "@/components/marketing/WhyGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FoundersAbout } from "@/components/marketing/FoundersAbout";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Contact } from "@/components/marketing/Contact";

export default function Home() {
  return (
    <>
      <Nav mode="marketing" />
      <Hero />
      <IntroStrip />
      <WhyGrid />
      <HowItWorks />
      <Testimonials />
      <FoundersAbout />
      <FinalCta />
      <Contact />
      <Footer mode="marketing" />
    </>
  );
}
```

- [ ] **Step 3: Side-by-side verify against the reference HTML**

```bash
npm run dev
```

Open `http://localhost:3000/` in one tab and `docs/reference/index.html` in another (drag into browser). Check: yellow nav, hero text, MIT badge position, stat numbers, why cards (navy + yellow border + icons), how-it-works numbered steps, testimonial quote glyphs, founders bio cards, contact form. Responsive breakpoint at 860px should match.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing src/app/page.tsx
git commit -m "port marketing home page to next"
```

---

## Task 6: Port marketing pricing page

**Files:**
- Create: `src/components/marketing/PricingTable.tsx`, `CurrencyToggle.tsx`
- Create: `src/app/pricing/page.tsx`

- [ ] **Step 1: `CurrencyToggle.tsx` (client)**

```tsx
"use client";
import { useState } from "react";
import clsx from "clsx";
export type Currency = "USD" | "GBP" | "CAD" | "NGN";
export const currencySymbols: Record<Currency, string> = { USD: "$", GBP: "£", CAD: "CA$", NGN: "₦" };

export function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  const opts: Currency[] = ["USD", "GBP", "CAD", "NGN"];
  return (
    <div className="inline-flex bg-white/10 rounded-pill p-1 gap-1 border-[1.5px] border-white/15">
      {opts.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={clsx("rounded-pill font-heading font-bold text-[13px] px-5 py-2 transition-colors", value === c ? "bg-yellow text-navy" : "text-white/55")}>
          {currencySymbols[c]} {c}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `PricingTable.tsx` (client)**

Port the pricing tiers from `docs/reference/pricing.html` verbatim (2x/3x/4x per week, monthly / 3-month / 6-month). Use the `data-usd` / `data-gbp` / `data-cad` / `data-ngn` values from the reference. Stateful `currency` selection swaps the rendered numbers; "Most popular" badge on the 3-sessions / 3-months upfront tile.

- [ ] **Step 3: `src/app/pricing/page.tsx`**

Composes Nav + page-header + CurrencyToggle + PricingTable + notes grid + CTA block + Footer. Metadata title: `Pricing | EduConnect`.

- [ ] **Step 4: Verify**

Open `/pricing`, toggle between USD/GBP/CAD/NGN. Numbers, symbols, and "save" figures must match the reference exactly.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/PricingTable.tsx src/components/marketing/CurrencyToggle.tsx src/app/pricing
git commit -m "port marketing pricing page to next"
```

---

## Task 7: Supabase — project init + migration 0001 (schema)

**Files:**
- Create: `supabase/config.toml` (via CLI)
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Initialize Supabase locally**

```bash
cd educonnect-lms
npx supabase init
npx supabase start
```

Expected: local Postgres + Supabase stack boots. Note printed `API URL`, `anon key`, `service_role key`. Copy them into `.env.local` (create it from `.env.local.example`).

- [ ] **Step 2: Write `supabase/migrations/0001_init.sql`**

```sql
-- extensions
create extension if not exists pgcrypto;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent','admin')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- profile auto-create trigger
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles(id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- registration-number generator
create sequence public.student_reg_seq start 1 no cycle;

create or replace function public.next_registration_number() returns text
language plpgsql as $$
declare n bigint; begin
  n := nextval('public.student_reg_seq');
  return format('EC-%s-%s', to_char(now(), 'YYYY'), to_char(n, 'FM00000'));
end;
$$;

-- students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  registration_number text unique not null,
  full_name text not null,
  preferred_name text,
  age smallint check (age between 3 and 25),
  gender text check (gender in ('male','female','prefer_not_to_say')),
  current_school text,
  curriculum text check (curriculum in ('british','nigerian','american','not_sure','other')),
  curriculum_other text,
  intake jsonb not null default '{}'::jsonb,
  intake_submitted_at timestamptz,
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- parent_students link
create table public.parent_students (
  parent_id  uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  primary key (parent_id, student_id)
);
create index on public.parent_students(student_id);

-- intake_files
create table public.intake_files (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null check (kind in ('curriculum','school_report','class_notes')),
  original_filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);
create index on public.intake_files(student_id);

-- subjects
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- subject_skills
create table public.subject_skills (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  description text,
  sort_order smallint not null default 0,
  unique (subject_id, name)
);

-- enrollments
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  requested_by uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, subject_id)
);

-- lesson_reports
create table public.lesson_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  lesson_date date not null,
  duration_minutes smallint not null check (duration_minutes between 1 and 600),
  lesson_focus text not null,
  understanding_check smallint not null check (understanding_check between 0 and 5),
  confidence_level   smallint not null check (confidence_level   between 0 and 5),
  lesson_highlights text,
  participation smallint not null check (participation between 0 and 5),
  focus_rating  smallint not null check (focus_rating  between 0 and 5),
  homework      smallint not null check (homework      between 0 and 5),
  next_focus text,
  how_to_help_at_home text,
  uploaded_by uuid not null references public.profiles(id),
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.lesson_reports(student_id, lesson_date desc);

-- lesson_report_skill_ratings
create table public.lesson_report_skill_ratings (
  lesson_report_id uuid not null references public.lesson_reports(id) on delete cascade,
  skill_id uuid not null references public.subject_skills(id),
  rating smallint not null check (rating between 0 and 5),
  primary key (lesson_report_id, skill_id)
);

-- is_admin helper
create or replace function public.is_admin(uid uuid) returns boolean
language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;
```

- [ ] **Step 3: Apply**

```bash
npx supabase db reset
```

Expected: migration runs cleanly, all tables listed. Confirm with `npx supabase db diff --schema public` (should be empty).

- [ ] **Step 4: Commit**

```bash
git add supabase/config.toml supabase/migrations/0001_init.sql
git commit -m "add initial schema migration with registration number generator"
```

---

## Task 8: Migration 0002 — Row Level Security policies

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- enable RLS
alter table public.profiles       enable row level security;
alter table public.students       enable row level security;
alter table public.parent_students enable row level security;
alter table public.intake_files   enable row level security;
alter table public.subjects       enable row level security;
alter table public.subject_skills enable row level security;
alter table public.enrollments    enable row level security;
alter table public.lesson_reports enable row level security;
alter table public.lesson_report_skill_ratings enable row level security;

-- profiles
create policy profiles_self_read   on public.profiles for select using (id = auth.uid() or public.is_admin(auth.uid()));
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin(auth.uid()));
create policy profiles_admin_all   on public.profiles for all    using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- students
create policy students_parent_read on public.students for select using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.parent_students ps where ps.student_id = id and ps.parent_id = auth.uid()
  )
);
create policy students_admin_write on public.students for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
-- parent insert goes through SECURITY DEFINER RPC (Task 10); no direct insert policy for parents

-- parent_students
create policy ps_read   on public.parent_students for select using (parent_id = auth.uid() or public.is_admin(auth.uid()));
create policy ps_insert on public.parent_students for insert with check (parent_id = auth.uid() or public.is_admin(auth.uid()));
create policy ps_admin  on public.parent_students for all    using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- intake_files
create policy intake_files_parent_read on public.intake_files for select using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.parent_students ps where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid()
  )
);
create policy intake_files_parent_insert on public.intake_files for insert with check (
  exists (select 1 from public.parent_students ps where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid())
);
create policy intake_files_admin on public.intake_files for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- subjects
create policy subjects_public_read on public.subjects for select using (not is_archived or public.is_admin(auth.uid()));
create policy subjects_admin_write on public.subjects for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- subject_skills
create policy subject_skills_read on public.subject_skills for select using (true);
create policy subject_skills_admin on public.subject_skills for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- enrollments
create policy enrollments_parent_read on public.enrollments for select using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.parent_students ps where ps.student_id = enrollments.student_id and ps.parent_id = auth.uid()
  )
);
create policy enrollments_parent_insert on public.enrollments for insert with check (
  requested_by = auth.uid() and exists (
    select 1 from public.parent_students ps where ps.student_id = enrollments.student_id and ps.parent_id = auth.uid()
  )
);
create policy enrollments_admin on public.enrollments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- lesson_reports
create policy reports_parent_read on public.lesson_reports for select using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.parent_students ps where ps.student_id = lesson_reports.student_id and ps.parent_id = auth.uid()
  )
);
create policy reports_admin on public.lesson_reports for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- lesson_report_skill_ratings
create policy ratings_parent_read on public.lesson_report_skill_ratings for select using (
  public.is_admin(auth.uid()) or exists (
    select 1
    from public.lesson_reports lr
    join public.parent_students ps on ps.student_id = lr.student_id
    where lr.id = lesson_report_skill_ratings.lesson_report_id and ps.parent_id = auth.uid()
  )
);
create policy ratings_admin on public.lesson_report_skill_ratings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
```

- [ ] **Step 2: Apply + sanity-check**

```bash
npx supabase db reset
psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -c "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind='r';"
```

Expected: every table shows `relrowsecurity = t`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "add row level security policies"
```

---

## Task 9: Migration 0003 — storage bucket for intake files

**Files:**
- Create: `supabase/migrations/0003_storage.sql`

- [ ] **Step 1: Write migration**

```sql
insert into storage.buckets (id, name, public) values ('intake-files', 'intake-files', false)
on conflict (id) do nothing;

-- read: admin or linked parent
create policy "intake_files_read"
on storage.objects for select
using (
  bucket_id = 'intake-files' and (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.parent_students ps
      where ps.parent_id = auth.uid()
        and ps.student_id::text = split_part(name, '/', 1)
    )
  )
);

-- insert: linked parent uploading under own student folder
create policy "intake_files_insert"
on storage.objects for insert
with check (
  bucket_id = 'intake-files' and exists (
    select 1 from public.parent_students ps
    where ps.parent_id = auth.uid()
      and ps.student_id::text = split_part(name, '/', 1)
  )
);

-- delete: parent of that student or admin
create policy "intake_files_delete"
on storage.objects for delete
using (
  bucket_id = 'intake-files' and (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.parent_students ps
      where ps.parent_id = auth.uid()
        and ps.student_id::text = split_part(name, '/', 1)
    )
  )
);
```

- [ ] **Step 2: Apply + commit**

```bash
npx supabase db reset
git add supabase/migrations/0003_storage.sql
git commit -m "add intake-files storage bucket with rls"
```

---

## Task 10: Migration 0004 — RPC to create a student with intake atomically

**Files:**
- Create: `supabase/migrations/0004_rpc_create_student.sql`

- [ ] **Step 1: Write migration**

```sql
create or replace function public.create_student_with_intake(
  p_full_name text,
  p_preferred_name text,
  p_age smallint,
  p_gender text,
  p_current_school text,
  p_curriculum text,
  p_curriculum_other text,
  p_intake jsonb
) returns public.students
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_student public.students;
  v_reg_no  text := public.next_registration_number();
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.students(
    registration_number, full_name, preferred_name, age, gender, current_school,
    curriculum, curriculum_other, intake, intake_submitted_at, added_by
  )
  values (
    v_reg_no, p_full_name, p_preferred_name, p_age, p_gender, p_current_school,
    p_curriculum, p_curriculum_other, coalesce(p_intake, '{}'::jsonb), now(), auth.uid()
  )
  returning * into v_student;

  insert into public.parent_students(parent_id, student_id)
  values (auth.uid(), v_student.id);

  return v_student;
end;
$$;

revoke all on function public.create_student_with_intake(text,text,smallint,text,text,text,text,jsonb) from public;
grant execute on function public.create_student_with_intake(text,text,smallint,text,text,text,text,jsonb) to authenticated;
```

- [ ] **Step 2: Apply + smoke**

```bash
npx supabase db reset
```

Then from the Supabase Studio SQL editor (while signed in as an authenticated user via a dev session), calling the function should return the new student row. This is fully exercised by the signup task's E2E later.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_rpc_create_student.sql
git commit -m "add rpc to create student with intake"
```

---

## Task 11: Migration 0005 — RPC to create a lesson report atomically

**Files:**
- Create: `supabase/migrations/0005_rpc_create_lesson_report.sql`

- [ ] **Step 1: Write migration**

```sql
create or replace function public.create_lesson_report(
  p_student_id uuid,
  p_subject_id uuid,
  p_lesson_date date,
  p_duration_minutes smallint,
  p_lesson_focus text,
  p_understanding_check smallint,
  p_confidence_level smallint,
  p_lesson_highlights text,
  p_participation smallint,
  p_focus_rating smallint,
  p_homework smallint,
  p_next_focus text,
  p_how_to_help_at_home text,
  p_skill_ratings jsonb  -- [{"skill_id":"uuid","rating":3}, ...]
) returns public.lesson_reports
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_report public.lesson_reports;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin only';
  end if;

  -- enrollment must be approved
  if not exists (
    select 1 from public.enrollments e
    where e.student_id = p_student_id and e.subject_id = p_subject_id and e.status = 'approved'
  ) then
    raise exception 'no approved enrollment for this student/subject';
  end if;

  insert into public.lesson_reports(
    student_id, subject_id, lesson_date, duration_minutes, lesson_focus,
    understanding_check, confidence_level, lesson_highlights,
    participation, focus_rating, homework, next_focus, how_to_help_at_home, uploaded_by
  )
  values (
    p_student_id, p_subject_id, p_lesson_date, p_duration_minutes, p_lesson_focus,
    p_understanding_check, p_confidence_level, p_lesson_highlights,
    p_participation, p_focus_rating, p_homework, p_next_focus, p_how_to_help_at_home, auth.uid()
  )
  returning * into v_report;

  if p_skill_ratings is not null and jsonb_array_length(p_skill_ratings) > 0 then
    insert into public.lesson_report_skill_ratings(lesson_report_id, skill_id, rating)
    select v_report.id, (r->>'skill_id')::uuid, (r->>'rating')::smallint
    from jsonb_array_elements(p_skill_ratings) r;
  end if;

  return v_report;
end;
$$;

revoke all on function public.create_lesson_report(
  uuid,uuid,date,smallint,text,smallint,smallint,text,smallint,smallint,smallint,text,text,jsonb
) from public;
grant execute on function public.create_lesson_report(
  uuid,uuid,date,smallint,text,smallint,smallint,text,smallint,smallint,smallint,text,text,jsonb
) to authenticated;
```

- [ ] **Step 2: Apply + commit**

```bash
npx supabase db reset
git add supabase/migrations/0005_rpc_create_lesson_report.sql
git commit -m "add rpc to create lesson report with skill ratings"
```

---

## Task 12: Seed + generate types

**Files:**
- Create: `supabase/seed.sql`
- Create (generated): `src/types/db.ts`

- [ ] **Step 1: Write seed**

```sql
-- subjects
insert into public.subjects (name, slug) values
  ('Mathematics', 'mathematics'),
  ('English',     'english'),
  ('Science',     'science')
on conflict (name) do nothing;

-- math skills
with m as (select id from public.subjects where slug='mathematics')
insert into public.subject_skills (subject_id, name, description, sort_order)
select m.id, v.name, v.description, v.sort_order from m,
(values
  ('Number sense',       'understanding numbers, place value', 1),
  ('Arithmetic accuracy','addition, subtraction, multiplication, division', 2),
  ('Problem solving',    'word problems, application', 3),
  ('Fractions & decimals', null, 4),
  ('Speed & fluency',    null, 5),
  ('Logical reasoning',  null, 6),
  ('Algebra',            null, 7),
  ('Geometry understanding', null, 8),
  ('Data interpretation', null, 9)
) v(name, description, sort_order)
on conflict do nothing;

-- english skills
with e as (select id from public.subjects where slug='english')
insert into public.subject_skills (subject_id, name, description, sort_order)
select e.id, v.name, v.description, v.sort_order from e,
(values
  ('Reading fluency',       'speed + accuracy', 1),
  ('Reading comprehension', 'understanding meaning', 2),
  ('Vocabulary development', null, 3),
  ('Grammar usage',          null, 4),
  ('Sentence construction',  null, 5),
  ('Spelling accuracy',      null, 6),
  ('Writing clarity',        'ideas plus structure', 7),
  ('Oral expression',        null, 8)
) v(name, description, sort_order)
on conflict do nothing;

-- science skills
with s as (select id from public.subjects where slug='science')
insert into public.subject_skills (subject_id, name, description, sort_order)
select s.id, v.name, v.description, v.sort_order from s,
(values
  ('Concept understanding',             null, 1),
  ('Application of concepts',           null, 2),
  ('Scientific reasoning',              null, 3),
  ('Terminology usage',                 null, 4),
  ('Experiment/observation understanding', null, 5),
  ('Problem solving in context',        null, 6)
) v(name, description, sort_order)
on conflict do nothing;
```

- [ ] **Step 2: Apply seed**

```bash
npx supabase db reset
psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/seed.sql
```

Verify:

```bash
psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -c "select s.name, count(ss.*) from public.subjects s left join public.subject_skills ss on ss.subject_id=s.id group by 1 order by 1;"
```

Expected: Mathematics=9, English=8, Science=6.

- [ ] **Step 3: Generate types**

```bash
mkdir -p src/types
npm run db:types
```

Expected: `src/types/db.ts` is populated with `Database` + table types.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql src/types/db.ts
git commit -m "seed subjects and skills; generate db types"
```

---

## Task 13: Supabase clients + auth helpers

**Files:**
- Create: `src/lib/supabase/browser.ts`, `server.ts`, `middleware.ts`
- Create: `src/lib/auth.ts`

- [ ] **Step 1: `src/lib/supabase/browser.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: `src/lib/supabase/server.ts`**

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* in RSC read-only */ }
        },
      },
    },
  );
}
```

- [ ] **Step 3: `src/lib/supabase/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { response, supabase, user };
}
```

- [ ] **Step 4: `src/lib/auth.ts`**

```ts
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, role, full_name, phone").eq("id", user.id).single();
  return data;
}

export async function requireParent(pathname: string) {
  const profile = await getProfile();
  if (!profile) redirect(`/login?from=${encodeURIComponent(pathname)}`);
  if (profile.role !== "parent") notFound();
  return profile;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") notFound();
  return profile;
}

export async function requireOnboardingComplete() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { count } = await supabase.from("parent_students").select("*", { count: "exact", head: true }).eq("parent_id", user.id);
  if (!count || count === 0) redirect("/onboarding");
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase src/lib/auth.ts
git commit -m "add supabase clients and auth helpers"
```

---

## Task 14: Root middleware — session refresh + route guards

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write middleware**

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/pricing", "/login", "/signup", "/forgot-password"];
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api/public");

  // unauthenticated trying protected area
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/onboarding"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // authenticated hitting login/signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const url = request.nextUrl.clone();
    url.pathname = profile?.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // parent onboarding gate for /dashboard
  if (user && pathname.startsWith("/dashboard")) {
    const { count } = await supabase.from("parent_students").select("*", { count: "exact", head: true }).eq("parent_id", user.id);
    if (!count) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // parent with a student visiting /onboarding
  if (user && pathname === "/onboarding") {
    const { count } = await supabase.from("parent_students").select("*", { count: "exact", head: true }).eq("parent_id", user.id);
    if (count && count > 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "add auth + onboarding middleware"
```

---

## Task 15: Zod schemas + formatters + unit tests

**Files:**
- Create: `src/lib/validation.ts`, `src/lib/format.ts`
- Create: `src/lib/__tests__/validation.test.ts`, `src/lib/__tests__/format.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/__tests__/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 2: `src/lib/validation.ts`**

Define zod schemas for: `signupSchema`, `loginSchema`, `intakeSchema` (composed from section schemas), `enrollmentRequestSchema`, `lessonReportSchema`. Export TypeScript types. `intakeSchema` matches the JSONB shape in the spec (objects per section, enums for multi-select options).

- [ ] **Step 3: `src/lib/format.ts`**

```ts
export function formatRegistrationNumber(raw: string): string {
  if (!/^EC-\d{4}-\d{5}$/.test(raw)) return raw;
  return raw;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
```

- [ ] **Step 4: Tests — write first, watch them fail, implement**

```ts
// validation.test.ts
import { describe, it, expect } from "vitest";
import { signupSchema, intakeSchema, lessonReportSchema } from "@/lib/validation";

describe("signupSchema", () => {
  it("rejects empty email", () => expect(signupSchema.safeParse({ email:"", password:"pass1234", full_name:"A", phone:"1" }).success).toBe(false));
  it("rejects short password", () => expect(signupSchema.safeParse({ email:"a@b.c", password:"short", full_name:"A", phone:"1" }).success).toBe(false));
  it("accepts valid", () => expect(signupSchema.safeParse({ email:"a@b.c", password:"pass1234", full_name:"A", phone:"+234123" }).success).toBe(true));
});

describe("lessonReportSchema", () => {
  it("rejects rating > 5", () => {
    const r = lessonReportSchema.safeParse({ student_id:"u", subject_id:"u", lesson_date:"2026-04-10", duration_minutes:60, lesson_focus:"x", understanding_check:3, confidence_level:3, lesson_highlights:"x", participation:6, focus_rating:3, homework:3, next_focus:"x", how_to_help_at_home:"x", skill_ratings:[] });
    expect(r.success).toBe(false);
  });
});
```

```ts
// format.test.ts
import { describe, it, expect } from "vitest";
import { formatDuration, formatRegistrationNumber } from "@/lib/format";

describe("formatDuration", () => {
  it("minutes only", () => expect(formatDuration(45)).toBe("45 min"));
  it("hours round", () => expect(formatDuration(120)).toBe("2 hr"));
  it("hours + minutes", () => expect(formatDuration(75)).toBe("1 hr 15 min"));
});

describe("formatRegistrationNumber", () => {
  it("passes through valid", () => expect(formatRegistrationNumber("EC-2026-00042")).toBe("EC-2026-00042"));
});
```

Run:

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/format.ts src/lib/__tests__ vitest.config.ts
git commit -m "add zod schemas, formatters and unit tests"
```

---

## Task 16: Auth pages — login, signup, forgot-password

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/forgot-password/page.tsx`
- Create: `src/lib/actions/signup.ts`, `src/lib/actions/profile.ts`

- [ ] **Step 1: `signup.ts` server action**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name, phone: parsed.data.phone } },
  });
  if (error) return { ok: false, error: error.message };
  redirect("/onboarding");
}
```

- [ ] **Step 2: `profile.ts` server action — login + logout**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.APP_URL}/login` });
  return error ? { ok: false, error: error.message } : { ok: true };
}
```

- [ ] **Step 3: Build themed pages**

Each page uses `<Container/>`, heading (Nunito), FormField/inputs styled with yellow/navy theme, the coral primary button. Show `from` error message via `useSearchParams()` client boundary if present. `/signup` has four fields (email, password, full_name, phone). `/login` has two. `/forgot-password` has one.

- [ ] **Step 4: Verify end-to-end**

```bash
npm run dev
```

- Visit `/signup` → submit with valid details → expect redirect to `/onboarding`.
- In the Supabase Studio, confirm the `auth.users` row exists AND `public.profiles` has a row with `role=parent` (trigger worked).
- Visit `/login` → submit same credentials → expect redirect to `/dashboard` or `/onboarding` (since no student yet, middleware redirects to `/onboarding`).

- [ ] **Step 5: Commit**

```bash
git add src/app/login src/app/signup src/app/forgot-password src/lib/actions/signup.ts src/lib/actions/profile.ts
git commit -m "add login, signup and forgot-password pages"
```

---

## Task 17: Onboarding intake form + submit action

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/components/intake/IntakeForm.tsx`
- Create: `src/components/intake/sections/ChildInfoSection.tsx`, `LearningBackgroundSection.tsx`, `StrengthsSection.tsx`, `ChallengesSection.tsx`, `MotivationSection.tsx`, `BehaviourSection.tsx`, `PersonalitySection.tsx`, `GoalsSection.tsx`
- Create: `src/lib/actions/onboarding.ts`

- [ ] **Step 1: Build each section component**

Each is a client component exporting a controlled form section bound to a single slice of the overall form state. Use `FormField`, `ChipGroup`, and a `BatteryBars` for the 1–5 "verbal expression comfort" scale. Options (enums) must match `intakeSchema` exactly.

- [ ] **Step 2: `IntakeForm.tsx` — client, holds state, renders sections**

```tsx
"use client";
import { useState, useTransition } from "react";
import { submitIntake } from "@/lib/actions/onboarding";
import { ChildInfoSection } from "./sections/ChildInfoSection";
// … imports for each section …

export type IntakeValues = { /* top-level shape mirroring intakeSchema */ };
const empty: IntakeValues = { /* populate with defaults */ };

export function IntakeForm({ onSuccessRedirect = "/dashboard" }: { onSuccessRedirect?: string }) {
  const [v, setV] = useState<IntakeValues>(empty);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form action={(fd) => startTransition(async () => {
      const res = await submitIntake(v);
      if (!res.ok) setErr(res.error); else window.location.assign(onSuccessRedirect);
    })} className="flex flex-col gap-10 pb-16">
      <ChildInfoSection value={v.childInfo} onChange={(next) => setV({ ...v, childInfo: next })} />
      {/* … other sections … */}
      {err && <div className="rounded-md border border-coral bg-coral/5 p-4 text-coral">{err}</div>}
      <button disabled={pending} className="self-start btn btn-primary">{pending ? "Submitting…" : "Submit intake"}</button>
    </form>
  );
}
```

- [ ] **Step 3: `onboarding.ts` server action**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { intakeSchema } from "@/lib/validation";

export async function submitIntake(payload: unknown) {
  const parsed = intakeSchema.safeParse(payload);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const i = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_student_with_intake", {
    p_full_name:       i.childInfo.full_name,
    p_preferred_name:  i.childInfo.preferred_name ?? null,
    p_age:             i.childInfo.age,
    p_gender:          i.childInfo.gender,
    p_current_school:  i.childInfo.current_school,
    p_curriculum:      i.childInfo.curriculum,
    p_curriculum_other: i.childInfo.curriculum_other ?? null,
    p_intake: {
      learning_background: i.learning_background,
      strengths:           i.strengths,
      challenges:          i.challenges,
      motivation:          i.motivation,
      behaviour:           i.behaviour,
      personality:         i.personality,
      goals:               i.goals,
    },
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, student: data };
}
```

(File upload handling is Task 18.)

- [ ] **Step 4: `/onboarding/page.tsx`**

Server component. Calls `requireParent(...)`. Renders a title + `<IntakeForm/>`.

- [ ] **Step 5: Verify**

Sign up a fresh parent → land on `/onboarding` → fill in fields → submit → redirected to `/dashboard`. In Supabase Studio: `students` has a row with a `registration_number`, `parent_students` has the link.

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding src/components/intake src/lib/actions/onboarding.ts
git commit -m "add onboarding intake form"
```

---

## Task 18: Intake file uploads (Section 1 optional)

**Files:**
- Modify: `src/components/intake/sections/ChildInfoSection.tsx`
- Modify: `src/lib/actions/onboarding.ts`
- Create: `src/app/api/intake-files/[id]/download/route.ts`

- [ ] **Step 1: File upload UI in `ChildInfoSection`**

Three optional inputs (curriculum, school_report, class_notes). Accept `.pdf,.doc,.docx,image/*`. Shown below Section 1. On submit the file blobs are part of the form state.

- [ ] **Step 2: Upload step in server action**

After `create_student_with_intake` succeeds and returns the new `student_id`, for each selected file:

```ts
const path = `${student_id}/${kind}-${crypto.randomUUID()}.${ext}`;
await supabase.storage.from("intake-files").upload(path, file, { contentType: file.type });
await supabase.from("intake_files").insert({
  student_id, kind, original_filename: file.name,
  storage_path: path, mime_type: file.type, size_bytes: file.size,
});
```

Server-side uploads use the same user-scoped Supabase client; RLS on `storage.objects` validates the `student_id` folder matches a `parent_students` row.

- [ ] **Step 3: Download route handler**

```ts
// src/app/api/intake-files/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: file } = await supabase.from("intake_files").select("storage_path, original_filename").eq("id", id).single();
  if (!file) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from("intake-files").createSignedUrl(file.storage_path, 60);
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
```

RLS on the `intake_files` select ensures a parent only gets a row for their own student; unauthorized requests see 404.

- [ ] **Step 4: Verify**

Upload a small PDF during onboarding → `intake_files` row exists → `/api/intake-files/{id}/download` redirects to a signed URL that serves the file. Sign in as a different parent and attempt the same download → 404.

- [ ] **Step 5: Commit**

```bash
git add src/components/intake/sections/ChildInfoSection.tsx src/lib/actions/onboarding.ts src/app/api/intake-files
git commit -m "add intake file uploads and download route"
```

---

## Task 19: Parent dashboard — layout, children list, add child

**Files:**
- Create: `src/app/(authed)/dashboard/layout.tsx`
- Create: `src/app/(authed)/dashboard/page.tsx`
- Create: `src/app/(authed)/dashboard/children/new/page.tsx`
- Create: `src/components/dashboard/ChildCard.tsx`

- [ ] **Step 1: Layout**

```tsx
// layout.tsx
import { requireParent, requireOnboardingComplete } from "@/lib/auth";
import { Nav } from "@/components/ui/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireParent("/dashboard");
  await requireOnboardingComplete();
  return (
    <>
      <Nav mode="authed" />
      <main className="bg-g50 min-h-screen py-12">{children}</main>
    </>
  );
}
```

- [ ] **Step 2: Children list**

```tsx
// page.tsx — server
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { ChildCard } from "@/components/dashboard/ChildCard";
import { Button } from "@/components/ui/Button";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, registration_number, full_name, preferred_name, current_school, enrollments(status, subject_id), lesson_reports(id, lesson_date, subject_id, understanding_check)")
    .order("created_at", { ascending: false });
  return (
    <Container>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl font-extrabold text-navy">My children</h1>
        <Button href="/dashboard/children/new">Add another child</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {students?.map((s) => <ChildCard key={s.id} student={s} />)}
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: `ChildCard.tsx` — compact summary**

Render reg number pill, full name (using preferred_name if present), current school, pill counts of approved / pending enrollments, latest report date. Link to `/dashboard/children/{id}`.

- [ ] **Step 4: Add-another-child page**

Reuses `IntakeForm` with `onSuccessRedirect="/dashboard"`.

- [ ] **Step 5: Verify + commit**

Sign in with a parent who has one student → dashboard shows one card. Click "Add another child" → intake form → submit → dashboard shows two cards.

```bash
git add "src/app/(authed)/dashboard" src/components/dashboard
git commit -m "add parent dashboard layout and children list"
```

---

## Task 20: Child detail page (profile + subjects + reports tabs)

**Files:**
- Create: `src/app/(authed)/dashboard/children/[id]/page.tsx`
- Create: `src/components/dashboard/IntakeSummary.tsx`, `EnrollmentsTab.tsx`, `ReportsTab.tsx`

- [ ] **Step 1: Server component fetches the full picture**

Fetch from `students` (with inner join to confirm ownership via RLS), enrollments with subject name, lesson_reports with subject name, intake_files list.

- [ ] **Step 2: Header block**

Reg number badge, name, school, curriculum, "Add subject" button → `enroll` page, "Edit intake" link.

- [ ] **Step 3: Tabs (URL-param based: `?tab=subjects|reports|intake`)**

- **Intake tab:** `IntakeSummary` — collapsible sections rendering the jsonb with friendly labels. Section 1 file list with download links to `/api/intake-files/{id}/download`.
- **Subjects tab:** `EnrollmentsTab` — list with status badge (`pending`/`approved`/`rejected`). "Request a subject" CTA.
- **Reports tab:** `ReportsTab` — chronological table (date, subject, understanding, confidence). Each row links to `/dashboard/children/{id}/reports/{reportId}`.

- [ ] **Step 4: Verify + commit**

```bash
git add "src/app/(authed)/dashboard/children/[id]" src/components/dashboard
git commit -m "add parent child detail page"
```

---

## Task 21: Enroll-subjects flow

**Files:**
- Create: `src/app/(authed)/dashboard/children/[id]/enroll/page.tsx`
- Create: `src/lib/actions/enrollments.ts`

- [ ] **Step 1: Server action**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestEnrollments(studentId: string, subjectIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "auth required" };
  const rows = subjectIds.map((subject_id) => ({ student_id: studentId, subject_id, requested_by: user.id }));
  const { error } = await supabase.from("enrollments").upsert(rows, { onConflict: "student_id,subject_id", ignoreDuplicates: true });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/dashboard/children/${studentId}`);
  return { ok: true as const };
}
```

- [ ] **Step 2: Page — list of non-archived subjects not yet enrolled**

Client component shows checkbox list, submit button calls `requestEnrollments`.

- [ ] **Step 3: Verify + commit**

```bash
git add "src/app/(authed)/dashboard/children/[id]/enroll" src/lib/actions/enrollments.ts
git commit -m "add subject enrollment request flow"
```

---

## Task 22: Parent lesson-report viewer

**Files:**
- Create: `src/app/(authed)/dashboard/children/[id]/reports/[reportId]/page.tsx`
- Create: `src/components/dashboard/ReportView.tsx`

- [ ] **Step 1: Fetch report + skills + ratings**

Server component joins `lesson_reports`, `subjects`, `subject_skills` (for that subject), and `lesson_report_skill_ratings`. RLS enforces visibility.

- [ ] **Step 2: `ReportView.tsx`**

Renders every field in a themed layout: header (child name + reg no + subject + date + duration); understanding/confidence via `BatteryBars readOnly`; lesson focus + highlights + next focus + how-to-help paragraphs; learning behaviours (3 battery bars); skill tracker (battery bar per seeded skill).

- [ ] **Step 3: Verify + commit**

```bash
git add "src/app/(authed)/dashboard/children/[id]/reports" src/components/dashboard/ReportView.tsx
git commit -m "add parent lesson report viewer"
```

---

## Task 23: Parent settings

**Files:**
- Create: `src/app/(authed)/dashboard/settings/page.tsx`

- [ ] **Step 1: Page**

Two forms: update profile (full_name, phone) → server action that updates `profiles` row for `auth.uid()`; change password → uses `supabase.auth.updateUser({ password })`. Success/error banners.

- [ ] **Step 2: Commit**

```bash
git add "src/app/(authed)/dashboard/settings"
git commit -m "add parent settings page"
```

---

## Task 24: Admin layout + overview

**Files:**
- Create: `src/app/(authed)/admin/layout.tsx`
- Create: `src/app/(authed)/admin/page.tsx`

- [ ] **Step 1: Layout**

```tsx
import { requireAdmin } from "@/lib/auth";
import { Nav } from "@/components/ui/Nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <Nav mode="authed" />
      <main className="bg-g50 min-h-screen py-12">{children}</main>
    </>
  );
}
```

- [ ] **Step 2: Overview page — three counts**

`select count(*) from students`, `count(*) from enrollments where status='pending'`, `count(*) from lesson_reports where created_at >= now() - interval '7 days'`. Render three themed cards with quick links to the deeper pages.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(authed)/admin/layout.tsx" "src/app/(authed)/admin/page.tsx"
git commit -m "add admin layout and overview"
```

---

## Task 25: Admin students — list + detail

**Files:**
- Create: `src/app/(authed)/admin/students/page.tsx`, `src/app/(authed)/admin/students/[id]/page.tsx`

- [ ] **Step 1: List**

Searchable table (reg no, full name, preferred name, school, age). Client-side search across the fetched rows (dataset is small for MVP).

- [ ] **Step 2: Detail**

Full student profile (reuses `IntakeSummary`), linked parents (emails via join with `profiles`), all enrollments with status, all lesson reports with link to the parent-facing viewer (admin can read everything via RLS).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(authed)/admin/students"
git commit -m "add admin students list and detail"
```

---

## Task 26: Admin enrollments queue

**Files:**
- Create: `src/app/(authed)/admin/enrollments/page.tsx`
- Modify: `src/lib/actions/enrollments.ts`

- [ ] **Step 1: Add admin actions**

```ts
"use server";
export async function decideEnrollment(id: string, decision: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("enrollments").update({ status: decision, decided_by: user!.id, decided_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/enrollments");
  return { ok: true as const };
}
```

- [ ] **Step 2: Page**

Table of `status='pending'` with student name + subject + parent + requested-at; inline Approve / Reject buttons call the server action.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(authed)/admin/enrollments" src/lib/actions/enrollments.ts
git commit -m "add admin enrollments queue"
```

---

## Task 27: Admin subjects CRUD

**Files:**
- Create: `src/app/(authed)/admin/subjects/page.tsx`
- Create: `src/lib/actions/subjects.ts`

- [ ] **Step 1: Actions**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }

export async function createSubject(name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({ name, slug: slugify(name) });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/subjects"); return { ok: true as const };
}

export async function renameSubject(id: string, name: string) { /* update name + slug */ }
export async function archiveSubject(id: string, archived: boolean) { /* update is_archived */ }
```

- [ ] **Step 2: Page**

List with inline rename, archive/unarchive toggle, "Add subject" form at the top. Note in the UI: "Skill trackers are seeded only for Mathematics, English, and Science — new subjects will render reports without the skill block."

- [ ] **Step 3: Commit**

```bash
git add "src/app/(authed)/admin/subjects" src/lib/actions/subjects.ts
git commit -m "add admin subjects management"
```

---

## Task 28: Email library — Resend + lesson-report template

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/__tests__/email.test.ts`

- [ ] **Step 1: Install Resend SDK**

```bash
npm install resend
```

- [ ] **Step 2: `email.ts`**

```ts
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type LessonReportEmail = {
  to: string; child_full_name: string; registration_number: string;
  subject_name: string; lesson_date: string; duration_minutes: number;
  lesson_focus: string; understanding_check: number; confidence_level: number;
  participation: number; focus_rating: number; homework: number;
  report_url: string;
};

export function renderLessonReportEmail(p: LessonReportEmail) {
  const subject = `New lesson report for ${p.child_full_name} — ${p.subject_name}, ${p.lesson_date}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #04131C;">
      <h2 style="font-size: 22px; margin: 0 0 8px;">New lesson report</h2>
      <p style="margin: 0 0 16px; color: #555;"><strong>${p.child_full_name}</strong> (${p.registration_number}) &middot; ${p.subject_name} &middot; ${p.lesson_date} &middot; ${p.duration_minutes} min</p>
      <p style="margin: 0 0 8px;"><strong>Lesson focus:</strong> ${escapeHtml(p.lesson_focus)}</p>
      <p style="margin: 0 0 8px;">Understanding: ${p.understanding_check}/5 &nbsp; Confidence: ${p.confidence_level}/5</p>
      <p style="margin: 0 0 16px;">Participation: ${p.participation}/5 &nbsp; Focus: ${p.focus_rating}/5 &nbsp; Homework: ${p.homework}/5</p>
      <a href="${p.report_url}" style="display: inline-block; background: #FF693F; color: #fff; padding: 12px 22px; border-radius: 100px; text-decoration: none; font-weight: bold;">View full report</a>
      <p style="margin: 24px 0 0; font-size: 12px; color: #999;">EduConnect — joineduconnect.com</p>
    </div>`;
  return { subject, html };
}

function escapeHtml(s: string) { return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }

export async function sendLessonReportEmail(p: LessonReportEmail) {
  if (!resend) return { ok: false as const, error: "RESEND_API_KEY missing" };
  const { subject, html } = renderLessonReportEmail(p);
  const { error } = await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL!, to: p.to, subject, html });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}
```

- [ ] **Step 3: Template test**

```ts
// email.test.ts
import { describe, it, expect } from "vitest";
import { renderLessonReportEmail } from "@/lib/email";

describe("renderLessonReportEmail", () => {
  it("includes registration number and scores", () => {
    const { subject, html } = renderLessonReportEmail({
      to:"a@b.c", child_full_name:"Adaeze", registration_number:"EC-2026-00001",
      subject_name:"Mathematics", lesson_date:"2026-04-10", duration_minutes:60, lesson_focus:"Fractions",
      understanding_check:4, confidence_level:3, participation:5, focus_rating:4, homework:3,
      report_url:"https://example.test/r/1",
    });
    expect(subject).toContain("Adaeze");
    expect(subject).toContain("Mathematics");
    expect(html).toContain("EC-2026-00001");
    expect(html).toContain("Fractions");
    expect(html).toContain("4/5");
  });
  it("escapes html in lesson focus", () => {
    const { html } = renderLessonReportEmail({ /* same shape */ lesson_focus: "<script>x</script>" } as any);
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
```

Run: `npm run test` → both pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts src/lib/__tests__/email.test.ts package.json package-lock.json
git commit -m "add resend email client and lesson report template"
```

---

## Task 29: Admin — compose lesson report + send email

**Files:**
- Create: `src/app/(authed)/admin/reports/new/page.tsx`
- Create: `src/components/admin/reports/ReportForm.tsx` + section components
- Create: `src/lib/actions/reports.ts`

- [ ] **Step 1: `ReportForm.tsx`**

Client component. Steps through:
1. Student select (searchable dropdown) → on change, fetch approved subjects for that student.
2. Subject select → on change, fetch `subject_skills` for that subject.
3. Lesson header (date, duration, lesson_focus).
4. Understanding + confidence (two `BatteryBars`).
5. Lesson highlights textarea.
6. Learning behaviours (three `BatteryBars`: participation, focus_rating, homework).
7. Skill tracker (one `BatteryBars` per `subject_skills` row; if zero, show a notice).
8. Next focus + how-to-help textareas.
9. Submit.

- [ ] **Step 2: `reports.ts` server action**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { lessonReportSchema } from "@/lib/validation";
import { sendLessonReportEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function createReport(input: unknown) {
  const parsed = lessonReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const i = parsed.data;
  const supabase = await createClient();
  const { data: report, error } = await supabase.rpc("create_lesson_report", {
    p_student_id: i.student_id, p_subject_id: i.subject_id,
    p_lesson_date: i.lesson_date, p_duration_minutes: i.duration_minutes,
    p_lesson_focus: i.lesson_focus, p_understanding_check: i.understanding_check,
    p_confidence_level: i.confidence_level, p_lesson_highlights: i.lesson_highlights ?? "",
    p_participation: i.participation, p_focus_rating: i.focus_rating, p_homework: i.homework,
    p_next_focus: i.next_focus ?? "", p_how_to_help_at_home: i.how_to_help_at_home ?? "",
    p_skill_ratings: i.skill_ratings,
  });
  if (error || !report) return { ok: false as const, error: error?.message ?? "insert failed" };

  // fetch parents + student + subject for email payload
  const { data: ctx } = await supabase
    .from("lesson_reports")
    .select("id, student_id, students(full_name, registration_number, parent_students(profiles(id)) ), subjects(name)")
    .eq("id", report.id).single();
  const parentIds: string[] = (ctx as any)?.students?.parent_students?.map((ps: any) => ps.profiles?.id).filter(Boolean) ?? [];
  const { data: parents } = await supabase.auth.admin.listUsers(); // only works with service-role client; use a dedicated admin client
  const emailPromises = parents?.users
    ?.filter((u) => parentIds.includes(u.id))
    .map((u) => sendLessonReportEmail({
      to: u.email!,
      child_full_name: (ctx as any).students.full_name,
      registration_number: (ctx as any).students.registration_number,
      subject_name: (ctx as any).subjects.name,
      lesson_date: i.lesson_date,
      duration_minutes: i.duration_minutes,
      lesson_focus: i.lesson_focus,
      understanding_check: i.understanding_check,
      confidence_level: i.confidence_level,
      participation: i.participation, focus_rating: i.focus_rating, homework: i.homework,
      report_url: `${process.env.APP_URL}/dashboard/children/${i.student_id}/reports/${report.id}`,
    })) ?? [];
  const results = await Promise.all(emailPromises);
  if (results.every((r) => r.ok)) {
    await supabase.from("lesson_reports").update({ emailed_at: new Date().toISOString() }).eq("id", report.id);
  }
  revalidatePath("/admin/reports");
  return { ok: true as const, id: report.id };
}
```

Note: looking up parent emails by joining `profiles` is simpler than using the admin API — `profiles` doesn't have email. Alternative: add an `email` column to `profiles` populated by the signup trigger. **Implementation note for the agent:** extend `handle_new_user()` to copy `new.email` into `profiles.email` and add the column via a small migration `0006_profiles_email.sql`; then select from `profiles` directly in this action instead of `auth.admin.listUsers()`. The migration + trigger edit is part of this task.

- [ ] **Step 3: Migration 0006 — profiles.email**

```sql
-- supabase/migrations/0006_profiles_email.sql
alter table public.profiles add column email text;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles(id, email, full_name, phone)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone','')
  );
  return new;
end;
$$;
```

Apply: `npx supabase db reset`. Then rerun signup so existing dev user(s) have email (or backfill via SQL editor: `update public.profiles p set email = u.email from auth.users u where u.id = p.id;`).

- [ ] **Step 4: Rewire the email lookup in `createReport`**

Replace the `auth.admin.listUsers` block with:

```ts
const { data: parentProfiles } = await supabase
  .from("profiles")
  .select("id, email")
  .in("id", parentIds);
const emailPromises = (parentProfiles ?? [])
  .filter((p) => !!p.email)
  .map((p) => sendLessonReportEmail({ to: p.email!, /* … same args … */ }));
```

- [ ] **Step 5: Verify**

- Sign in as admin, approve an enrollment for a student.
- Compose and submit a lesson report.
- `lesson_reports` row exists with matching `lesson_report_skill_ratings` count.
- Resend dashboard shows the delivery.
- `emailed_at` is set on the report row.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(authed)/admin/reports/new" src/components/admin/reports src/lib/actions/reports.ts supabase/migrations/0006_profiles_email.sql
git commit -m "add admin lesson report composer and email"
```

---

## Task 30: Admin reports list + retry email

**Files:**
- Create: `src/app/(authed)/admin/reports/page.tsx`
- Modify: `src/lib/actions/reports.ts`

- [ ] **Step 1: Add `retrySendEmail(id)`**

Re-runs the email composition using the stored report + student + parents. Updates `emailed_at` on success.

- [ ] **Step 2: List page**

Filterable table (date range, subject, student). Columns: date, student name + reg no, subject, understanding, emailed (check or "Retry" button).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(authed)/admin/reports/page.tsx" src/lib/actions/reports.ts
git commit -m "add admin reports list and retry email"
```

---

## Task 31: Not-found + error pages

**Files:**
- Create: `src/app/not-found.tsx`, `src/app/error.tsx`

- [ ] **Step 1: Themed fallbacks**

`not-found.tsx`: yellow background, navy heading "Page not found", coral button → `/`. `error.tsx` (client): similar, but with "Something went wrong" and a retry button calling `reset()`.

- [ ] **Step 2: Commit**

```bash
git add src/app/not-found.tsx src/app/error.tsx
git commit -m "add not-found and error fallbacks"
```

---

## Task 32: Playwright smoke test + RLS isolation test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/signup-onboarding.spec.ts`
- Create: `tests/rls/parent-isolation.test.ts`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI },
  timeout: 60_000,
});
```

- [ ] **Step 2: Smoke test**

```ts
import { test, expect } from "@playwright/test";

test("signup → onboarding → dashboard", async ({ page }) => {
  const email = `test+${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("password123");
  await page.getByLabel(/full name/i).fill("Test Parent");
  await page.getByLabel(/phone/i).fill("+2341234567");
  await page.getByRole("button", { name: /sign up/i }).click();
  await page.waitForURL(/\/onboarding/);

  await page.getByLabel(/child.*full name/i).fill("Test Child");
  await page.getByLabel(/age/i).fill("10");
  await page.getByLabel(/current school/i).fill("Test School");
  await page.getByRole("radio", { name: /british/i }).check();
  // … fill remaining required fields per IntakeForm …
  await page.getByRole("button", { name: /submit intake/i }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText("Test Child")).toBeVisible();
});
```

Run (requires local Supabase + `.env.local` populated):

```bash
npm run test:e2e
```

- [ ] **Step 3: RLS isolation test**

Node script using two anon-key clients signed in as two different users (via `supabase.auth.signInWithPassword`); verify user B cannot `select` user A's student.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests
git commit -m "add playwright smoke and rls isolation tests"
```

---

## Task 33: CLAUDE.md + deployment notes

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md per the spec's "CLAUDE.md Outline" section**

Cover: project summary, stack, commands, folder map, auth/RLS model (+ onboarding gate), theme tokens (include cyan) + **brand font caveat** ("Brand guide specifies Rimouski + Gill Sans Infant Std; production temporarily uses Nunito + Nunito Sans until brand font files are licensed; switch via `next/font/local`"), registration number format, intake form structure, lesson report structure + seeded skills, conventions (server actions + zod, no client secrets, middleware guards, `requireParent` / `requireAdmin` / `requireOnboardingComplete`), recipes, env vars (including `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`), Vercel + Supabase + Resend deployment checklist.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "add CLAUDE.md"
```

---

## Execution Notes

- Tasks 1–6 get a visibly themed marketing site live without Supabase.
- Tasks 7–12 stand up the database and types; nothing renders differently yet.
- Tasks 13–16 unlock authentication.
- Tasks 17–18 unlock parent onboarding (with or without file uploads).
- Tasks 19–23 complete the parent experience.
- Tasks 24–27 stand up the admin tools.
- Tasks 28–30 wire the reporting + email loop — the system's headline feature.
- Tasks 31–33 finish polish, testing, and docs.

## Self-Review

- **Spec coverage:**
  - Onboarding intake form with file uploads: Tasks 17–18. ✓
  - Registration number: migration 0001 + RPC 0004 + verified via E2E. ✓
  - Lesson reports (per-session, rich template): 0001 + 0005 + 11 + 22 + 29. ✓
  - Email on report: 28 + 29 + 30. ✓
  - Parent isolation via RLS: 0002 + Task 32. ✓
  - Admin flows: 24–30. ✓
  - Marketing parity: 5–6. ✓
  - Brand font caveat / cyan token: Task 33 (docs) + Task 3 (token). ✓
- **Placeholder scan:** none.
- **Type consistency:** `focus_rating` column + RPC param + form field all align.
