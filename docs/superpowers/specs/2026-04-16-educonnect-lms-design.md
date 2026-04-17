# EduConnect LMS — Design Spec

**Date:** 2026-04-16 (revised 2026-04-18 for intake + lesson reports + email)
**Status:** Approved for planning

## Overview

A minimal web-based school management system for EduConnect. Parents sign up on the website, complete an onboarding intake form about their child, and — once admin approves their subject enrollments — begin receiving detailed per-lesson reports (in-app and by email) after every session. Admins manage students, subjects, enrollment approvals, and compose the lesson reports. There is no teacher role in this MVP.

The repo currently contains two static marketing pages (`index.html`, `pricing.html`) and an official brand guide PDF. This project ports the marketing site into a Next.js app, adds the authenticated parent and admin experiences, and wires Supabase for data/auth/storage plus Resend for transactional email.

## Goals

- Port the existing marketing site (`index.html`, `pricing.html`) into Next.js with reusable theme components.
- Parent flow: self-signup → onboarding intake form (8 sections) → dashboard showing children + status + lesson reports; parents request subject enrollments and add further children.
- Admin flow: manage students, subjects, enrollment approvals, and compose lesson reports (with 0–5 skill ratings) that are delivered in-app and by email.
- Registration numbers (`EC-YYYY-NNNNN`) auto-assigned to every student.
- Exact visual parity with the existing marketing HTML — navy/blue/yellow/coral palette, pill buttons, yellow sticky nav, Nunito/Nunito Sans fonts (until brand fonts Rimouski + Gill Sans Infant Std are licensed and self-hosted).
- Deploy on Vercel + Supabase (cloud) + Resend.
- `CLAUDE.md` documenting stack, conventions, and how to extend.

## Non-Goals (MVP)

- No teacher role or teacher-facing view.
- No multi-school / tenant support.
- No in-app messaging, scheduling, or billing.
- No bulk lesson-report import — single report at a time.
- No admin-management UI — promoting a user to admin is a manual flip of `profiles.role` in the Supabase table editor.
- No multi-step wizard for intake — one long, sectioned page is sufficient; progress is submitted in one shot.
- No PDF generation of the lesson report — the HTML view in the dashboard + the email is the canonical artifact.
- No rich test suite — zod schema unit tests + one Playwright happy-path smoke test + one RLS isolation test.

## Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript, ESLint). Scaffolded with `create-next-app` using Tailwind + App Router + `src/` directory.
- **Database / Auth / Storage:** Supabase (Postgres, Auth, Storage, RLS) via `@supabase/ssr`.
- **Email:** Resend (transactional). SDK used only from server actions / route handlers; never exposed to the browser.
- **Styling:** Tailwind CSS with theme tokens encoded in `tailwind.config.ts`. Fonts via `next/font/google`.
- **Hosting:** Vercel (Next) + Supabase cloud + Resend cloud.
- **Env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `RESEND_API_KEY` (server-only)
  - `RESEND_FROM_EMAIL` (e.g. `EduConnect <no-reply@joineduconnect.com>`)
  - `APP_URL` (e.g. `https://app.joineduconnect.com`) — used to construct links in emails

## Domain Decisions (from brainstorm + brand guide + reporting template)

| Decision | Choice |
| --- | --- |
| Parent↔student linking | Parent self-signs up with minimal fields; intake form at `/onboarding` is gated and required before `/dashboard` opens; that form creates the first student with a registration number. Additional children added later via the same form at `/dashboard/children/new`. Admin can unlink/delete. |
| Primary artifact for parents | **Lesson reports** (per-session, rich template with 0–5 skill ratings) — replaces the earlier "single term score" idea. No separate end-of-term results entity. |
| Enrollment flow | Parent requests subjects from catalog → `pending` → admin approves / rejects. Lesson reports may only be written against `approved` enrollments. |
| Registration number | `EC-YYYY-NNNNN` (e.g. `EC-2026-00001`) — year derived from record creation, number from a yearly Postgres sequence. Assigned inside the same RPC that creates the student. |
| Intake form storage | Structured columns on `students` for queryable fields (`registration_number`, `full_name`, `preferred_name`, `age`, `gender`, `current_school`, `curriculum`). All open-text, multi-select, and scale fields in Sections 2–8 stored in one `intake jsonb`. Optional Section 1 files in the `intake-files` bucket. |
| Subject-specific skills | Seeded `subject_skills` rows for Mathematics (9), English (8), Science (6), matching the reporting template verbatim. Admin can later add skills for other subjects via a small CRUD (out of MVP scope — skill-less subjects simply render with no skill tracker block). |
| Term representation | Kept for enrollment context only (enrollments capture a `first_term` label for records). Lesson reports do **not** carry a term — they carry a `lesson_date`. |
| Subject catalog | Admin-managed; seeded with Maths, English, Science. |
| Admin promotion | Flip `profiles.role` to `'admin'` in the Supabase table editor. |
| Marketing pages | Ported to Next routes with shared `<Nav/>`, `<Footer/>`, theme primitives. |
| CSS approach | Tailwind with theme tokens (colors, pill radius, fonts). |
| Brand fonts caveat | Brand guide specifies Rimouski (primary) + Gill Sans Infant Std (secondary). Both are commercial; existing marketing HTML uses Nunito + Nunito Sans (close approximations on Google Fonts). MVP keeps Nunito / Nunito Sans. When font files are licensed and provided, swap via `next/font/local` — no other code changes needed. |
| Email | Resend, triggered from the admin "submit lesson report" server action. One email per linked parent per report. |

## Data Model

All tables in `public` schema. Row Level Security enabled on every table.

### `profiles`
One row per `auth.users` row; created by trigger on insert.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, references `auth.users.id` on delete cascade |
| `role` | `text` | `not null default 'parent'`, `check (role in ('parent','admin'))` |
| `full_name` | `text` | |
| `phone` | `text` | |
| `created_at` | `timestamptz` | `default now()` |

### `students`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `registration_number` | `text` | `unique not null` — `EC-YYYY-NNNNN` |
| `full_name` | `text` | `not null` |
| `preferred_name` | `text` | nullable |
| `age` | `smallint` | `check (age >= 3 and age <= 25)` |
| `gender` | `text` | `check in ('male','female','prefer_not_to_say')` |
| `current_school` | `text` | |
| `curriculum` | `text` | `check in ('british','nigerian','american','not_sure','other')` |
| `curriculum_other` | `text` | nullable — free text if `curriculum='other'` |
| `intake` | `jsonb` | `not null default '{}'::jsonb` — sections 2–8 (see schema below) |
| `intake_submitted_at` | `timestamptz` | nullable — set when intake form is first submitted |
| `added_by` | `uuid` | references `profiles(id)` — parent or admin |
| `created_at` | `timestamptz` | `default now()` |

`intake` JSONB shape (validated at app layer, not DB — schema may evolve):

```json
{
  "learning_background": {
    "prior_tutoring": "yes|no",
    "prior_tutoring_notes": "string",
    "recent_changes": "string"
  },
  "strengths": {
    "enjoys_or_excels_at": "string",
    "confident_situations": "string",
    "interests": ["reading","writing","music","sports","art","games","technology"]
  },
  "challenges": {
    "challenging_areas": "string",
    "struggling_subjects": "string",
    "response_when_difficult": "tries_again|asks_for_help|gets_frustrated|withdraws|it_depends",
    "main_concerns": "string"
  },
  "motivation": {
    "motivators": ["praise","rewards","challenge","independence","competition","structured_guidance","not_sure"],
    "demotivators": "string"
  },
  "behaviour": {
    "attention_span": "very_focused|short_bursts|easily_distracted|needs_supervision|varies",
    "work_preference": "alone|with_guidance|mix",
    "how_communicates_confusion": "string",
    "helpful_routines": "string"
  },
  "personality": {
    "description": "string",
    "traits": ["quiet","talkative","curious","shy","confident","careful","perfectionist","easily_distracted","reflective","independent"],
    "verbal_expression_comfort": 1
  },
  "goals": {
    "improvement_8_12_weeks": "string",
    "breakthrough_priority": "string"
  }
}
```

### `intake_files`
Metadata for Section 1 optional uploads; binary lives in Supabase Storage.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `student_id` | `uuid` | references `students(id)` on delete cascade |
| `kind` | `text` | `check in ('curriculum','school_report','class_notes')` |
| `original_filename` | `text` | |
| `storage_path` | `text` | key in `intake-files` bucket |
| `mime_type` | `text` | |
| `size_bytes` | `bigint` | |
| `uploaded_at` | `timestamptz` | `default now()` |

### `parent_students`

| Column | Type | Notes |
| --- | --- | --- |
| `parent_id` | `uuid` | references `profiles(id)` on delete cascade |
| `student_id` | `uuid` | references `students(id)` on delete cascade |
| PK | `(parent_id, student_id)` | |

### `subjects`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `name` | `text` | `unique not null` |
| `slug` | `text` | `unique not null` — e.g. `mathematics`, `english`, `science`; used to look up seeded skill sets |
| `is_archived` | `boolean` | `default false` |
| `created_at` | `timestamptz` | `default now()` |

Seed: `Mathematics` (slug `mathematics`), `English` (slug `english`), `Science` (slug `science`).

### `subject_skills`
Seed-data-defined list of skills per subject (for the skill tracker).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `subject_id` | `uuid` | references `subjects(id)` on delete cascade |
| `name` | `text` | human-readable skill name |
| `description` | `text` | nullable — clarifying parenthetical from the template |
| `sort_order` | `smallint` | |
| unique | `(subject_id, name)` | |

Seed content (from the reporting template, verbatim):
- **Mathematics (9):** Number sense (understanding numbers, place value); Arithmetic accuracy (addition, subtraction, multiplication, division); Problem solving (word problems, application); Fractions & decimals; Speed & fluency; Logical reasoning; Algebra; Geometry understanding; Data interpretation.
- **English (8):** Reading fluency (speed + accuracy); Reading comprehension (understanding meaning); Vocabulary development; Grammar usage; Sentence construction; Spelling accuracy; Writing clarity (ideas plus structure); Oral expression.
- **Science (6):** Concept understanding; Application of concepts; Scientific reasoning; Terminology usage; Experiment/observation understanding; Problem solving in context.

### `enrollments`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `student_id` | `uuid` | references `students(id)` on delete cascade |
| `subject_id` | `uuid` | references `subjects(id)` |
| `requested_by` | `uuid` | references `profiles(id)` — the parent |
| `status` | `text` | `check in ('pending','approved','rejected') default 'pending'` |
| `decided_by` | `uuid` | references `profiles(id)` — the admin |
| `decided_at` | `timestamptz` | |
| `created_at` | `timestamptz` | `default now()` |
| unique | `(student_id, subject_id)` | |

### `lesson_reports`
One row per lesson session. Replaces the earlier term-level `results` idea.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `student_id` | `uuid` | references `students(id)` |
| `subject_id` | `uuid` | references `subjects(id)` |
| `lesson_date` | `date` | `not null` |
| `duration_minutes` | `smallint` | `check (duration_minutes > 0 and duration_minutes <= 600)` |
| `lesson_focus` | `text` | "Currently Learning / Lesson Focus" |
| `understanding_check` | `smallint` | `check (0..5)` |
| `confidence_level` | `smallint` | `check (0..5)` |
| `lesson_highlights` | `text` | |
| `participation` | `smallint` | `check (0..5)` |
| `focus_rating` | `smallint` | `check (0..5)` — (`focus` is a reserved-ish word pattern; prefix for clarity) |
| `homework` | `smallint` | `check (0..5)` |
| `next_focus` | `text` | |
| `how_to_help_at_home` | `text` | |
| `uploaded_by` | `uuid` | references `profiles(id)` |
| `emailed_at` | `timestamptz` | nullable — timestamp when email delivery succeeded |
| `created_at` | `timestamptz` | `default now()` |

Invariant enforced in the admin action (not DB): a `lesson_report` can only be inserted when there is an `approved` enrollment for `(student_id, subject_id)`.

### `lesson_report_skill_ratings`
Per-skill 0–5 rating for the skills of the report's subject.

| Column | Type | Notes |
| --- | --- | --- |
| `lesson_report_id` | `uuid` | references `lesson_reports(id)` on delete cascade |
| `skill_id` | `uuid` | references `subject_skills(id)` |
| `rating` | `smallint` | `check (0..5)` |
| PK | `(lesson_report_id, skill_id)` | |

### Storage buckets

- `intake-files` — **private**. Objects at `{student_id}/{kind}-{uuid}.{ext}`.
- No bucket for lesson reports (no file attachments on reports in MVP).

### Profile auto-creation trigger

```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Role defaults to `parent`. Promoting to admin is a manual `update profiles set role='admin' where id=...`.

### Registration number generation

```sql
create sequence public.student_reg_seq start 1 cycle;

create function public.next_registration_number() returns text as $$
declare n bigint;
begin
  n := nextval('public.student_reg_seq');
  return format('EC-%s-%s',
    to_char(now(), 'YYYY'),
    to_char(n, 'FM00000')
  );
end;
$$ language plpgsql;
```

Called inside the `create_student_with_intake` RPC (atomic: insert student → insert parent_students link → return student row). Sequence resets are not automated; the format still includes the year so collisions at year boundary are not a concern for expected volumes.

## Row Level Security (summary)

"Admin" means `(select role from profiles where id = auth.uid()) = 'admin'`.

| Table | Parent | Admin |
| --- | --- | --- |
| `profiles` | read/update own | read/update all |
| `students` | read via `parent_students`; insert via the create-student RPC only (RPC enforces parent link); no delete | full |
| `intake_files` | read for own students; insert for own students; delete own | full |
| `parent_students` | read own; insert with `parent_id = auth.uid()`; no delete | full |
| `subjects` | read non-archived | full |
| `subject_skills` | read | full |
| `enrollments` | read for own students; insert with `requested_by = auth.uid()` and student is own; no update/delete | read/update all |
| `lesson_reports` | read for own students | full |
| `lesson_report_skill_ratings` | read where parent can read the parent report | full |

Storage `intake-files`: bucket private; downloads served via a Next route handler that verifies the requesting user is linked to the `student_id` in the path, then issues a signed URL.

## Routes & Flows

### Public (marketing)

- `/` — ported `index.html` (hero, why, how it works, testimonials, founders/about, CTA, contact).
- `/pricing` — ported `pricing.html` with USD/GBP/CAD/NGN toggle.
- Shared `<Nav/>`, `<Footer/>`. Nav shows "Log in" and "Sign up" next to the Google Calendar CTA.

### Auth

- `/login` — email + password.
- `/signup` — minimal: email, password, parent full name, phone. Creates auth user. Redirect to `/onboarding`.
- `/forgot-password` — Supabase reset email.

### Onboarding (parent, gated until complete)

- `/onboarding` — long-form intake (Section 1 structured fields + Sections 2–8 open/multi-select). Section 1 optional file uploads posted to `intake-files`. Submit calls `create_student_with_intake` RPC; server action assigns registration number and redirects to `/dashboard`.
- Middleware rule: if `role='parent'` and user has zero `parent_students` rows, redirect any `/dashboard/**` hit to `/onboarding`. Once at least one student exists, `/onboarding` redirects to `/dashboard`.

### Parent (`/dashboard/**`, role=parent)

- `/dashboard` — children cards (name + reg no + enrollment summary + latest report snippet).
- `/dashboard/children/new` — reuses the intake form to add another child.
- `/dashboard/children/[id]` — child profile (reg no, school, curriculum, intake summary with collapsible sections, intake file downloads) + tabs:
  - **Subjects:** enrollments with status badges.
  - **Reports:** table of lesson reports (date, subject, understanding, confidence, link to full report).
- `/dashboard/children/[id]/enroll` — subject catalog checkboxes → creates `pending` enrollments.
- `/dashboard/children/[id]/reports/[reportId]` — full lesson report view (all fields + skill bars).
- `/dashboard/settings` — update own name/phone, change password.

### Admin (`/admin/**`, role=admin)

- `/admin` — overview counts (students, pending enrollments, reports this week).
- `/admin/students` — searchable table (reg no, name, school).
- `/admin/students/[id]` — full student view: intake, linked parents, enrollments, reports history.
- `/admin/enrollments` — pending queue with approve/reject.
- `/admin/subjects` — CRUD (add, rename, archive).
- `/admin/reports` — list of lesson reports, filters (student, subject, date range).
- `/admin/reports/new` — compose form: student → subject (limited to approved enrollments) → lesson date → duration → lesson focus → understanding/confidence → lesson highlights → participation/focus/homework → skill ratings (0–5 per skill pulled from `subject_skills`) → next focus → how to help at home. Submit inserts rows and triggers email.

### API

- `app/api/intake-files/[id]/download` — GET. Server checks the calling user is linked to the `intake_files.student_id`, then returns a short-lived signed URL.

## Signup + Onboarding data flow

1. `/signup` form submit → server action validates with zod → `supabase.auth.signUp(email, password, { data: { full_name, phone } })` → trigger creates profile (role `parent`).
2. Redirect to `/onboarding`.
3. `/onboarding` — parent fills intake. Optional file uploads go directly to the `intake-files` bucket (client upload using a scoped upload URL issued by a server action, so we don't proxy binary through the server). File metadata collected into the form payload.
4. Submit → server action validates (zod) → calls SQL RPC `create_student_with_intake(parent_id, payload jsonb, files jsonb[])`:
   - `select public.next_registration_number()`
   - `insert into students(...)` returning `id`
   - `insert into parent_students(parent_id, student_id)`
   - `insert into intake_files(...)` for each file entry
   - returns the new `student_id`
5. Server action redirects to `/dashboard`.

## Lesson-report submission + email flow

1. Admin opens `/admin/reports/new`, picks a student; the subject dropdown is limited to that student's **approved** enrollments.
2. Subject selection triggers a server fetch of `subject_skills` rows for that subject (rendered as 0–5 battery bars).
3. Submit → server action validates → inserts `lesson_reports` row + `lesson_report_skill_ratings` rows in a single transaction (RPC `create_lesson_report`).
4. Same server action looks up linked parent emails, composes the email via Resend (templated HTML — see below), and awaits send results. On success, sets `lesson_reports.emailed_at = now()`.
5. Email failure does **not** roll back the report insert; failure is logged and surfaced on `/admin/reports` as a "retry email" action.

### Email template (Resend)

Subject: `New lesson report for {child_full_name} — {subject_name}, {lesson_date}`

Body (HTML): child name + registration number, subject, date, duration, a brief extract of lesson focus, a summary of the three learning behaviours (0–5), and a CTA button linking to `${APP_URL}/dashboard/children/{student_id}/reports/{report_id}`. Full detail lives in the app — the email is a notifier, not a replacement.

## Theme System (Tailwind)

`tailwind.config.ts` extends:

```ts
colors: {
  navy:   '#04131C',   // Midnight Navy
  blue:   '#3EBEFF',   // Sky Blue
  yellow: '#FCB936',   // Sunrise Yellow
  coral:  '#FF693F',   // Vibrant Coral
  cyan:   '#42DBFD',   // Fresh Cyan (supporting)
  g50:    '#F8F7F5', g100: '#EEECEA', g400: '#999999', g600: '#555555',
},
borderRadius: { pill: '100px', lg: '16px', md: '10px' },
fontFamily: {
  heading: ['var(--font-nunito)', 'sans-serif'],
  sans:    ['var(--font-nunito-sans)', 'sans-serif'],
},
keyframes: { float: {...}, fadeUp: {...} },
animation: { float: 'float 4s ease-in-out infinite', 'fade-up': 'fadeUp 0.6s ease both' },
```

Fonts loaded in `app/layout.tsx` via `next/font/google` (Nunito + Nunito Sans). The brand guide specifies Rimouski + Gill Sans Infant Std; those are commercial fonts and the existing `index.html`/`pricing.html` already use Nunito + Nunito Sans as the production approximation. When the brand font files are provided, switch to `next/font/local`.

`globals.css` holds resets, base fonts, smooth scroll, and two dot-pattern utility classes (`.bg-dot-navy`, `.bg-dot-blue`) lifted verbatim from the reference HTML.

### Reusable UI primitives (`src/components/ui/`)

`Nav`, `Footer`, `Button`, `Container`, `Eyebrow`, `SectionHeader`, `Card`, `IntersectionFade`, `BatteryBars` (0–5 visual), `FormField`, `ChipGroup` (for multi-selects in intake).

### Marketing components (`src/components/marketing/`)

`Hero`, `IntroStrip`, `WhyGrid`, `HowItWorks`, `Testimonials`, `FoundersAbout`, `FinalCta`, `Contact`, `PricingTable`, `CurrencyToggle`.

### Intake form components (`src/components/intake/`)

One component per section (`ChildInfoSection`, `LearningBackgroundSection`, `StrengthsSection`, `ChallengesSection`, `MotivationSection`, `BehaviourSection`, `PersonalitySection`, `GoalsSection`) composed into `IntakeForm.tsx`.

### Report form components (`src/components/admin/reports/`)

`ReportHeaderFields`, `UnderstandingConfidence`, `LessonNotes`, `LearningBehaviours` (three battery bars), `SkillTracker` (dynamic battery bars driven by `subject_skills`), `ReportSummary`.

## Project Structure

```
src/
  app/
    layout.tsx
    globals.css
    page.tsx                               # / (marketing)
    pricing/page.tsx
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    onboarding/page.tsx                    # intake form (gated)
    (authed)/
      dashboard/
        layout.tsx                         # requireParent(); enforces onboarding-complete
        page.tsx
        children/
          new/page.tsx
          [id]/
            page.tsx
            enroll/page.tsx
            reports/[reportId]/page.tsx
        settings/page.tsx
      admin/
        layout.tsx                         # requireAdmin()
        page.tsx
        students/
          page.tsx
          [id]/page.tsx
        enrollments/page.tsx
        subjects/page.tsx
        reports/
          page.tsx
          new/page.tsx
    api/
      intake-files/[id]/download/route.ts
    not-found.tsx
    error.tsx
  components/
    ui/
    marketing/
    intake/
    dashboard/
    admin/
  lib/
    supabase/{browser,server,middleware}.ts
    auth.ts                                # getUser, getProfile, requireParent, requireAdmin, requireOnboardingComplete
    validation.ts                          # zod: signup, intake (section-by-section), enrollment, lesson-report
    format.ts                              # date, reg-no, duration, currency
    email.ts                               # Resend client + lesson-report email template
    actions/
      signup.ts
      onboarding.ts
      children.ts
      enrollments.ts
      subjects.ts
      reports.ts
      profile.ts
  types/db.ts                              # generated via supabase gen types
middleware.ts
supabase/
  migrations/
    0001_init.sql                          # tables + trigger + registration-number sequence/function
    0002_rls.sql
    0003_storage.sql                       # intake-files bucket + policies
    0004_rpc_create_student.sql            # atomic insert of student + parent_students + intake_files
    0005_rpc_create_lesson_report.sql      # atomic insert of report + skill_ratings
  seed.sql                                 # subjects + subject_skills
CLAUDE.md
```

## Error Handling

- Server actions return `{ ok: true, data } | { ok: false, error: string }`. Forms render errors inline.
- All mutating inputs validated with zod.
- Auth failure → `redirect('/login?from=' + currentPath)`.
- Parent without completed intake hitting `/dashboard/**` → `redirect('/onboarding')`.
- Role mismatch → `notFound()`.
- Email send failure → logged; report row keeps `emailed_at = null`; admin list shows a "retry email" action.
- `app/not-found.tsx` and `app/error.tsx` styled with theme.

## Testing

- **Unit (Vitest):** zod schemas (`validation.ts`), formatters (`format.ts` — especially `formatRegistrationNumber`, `formatDuration`, date helpers), email template renderer.
- **RLS:** SQL-level script run against `supabase start` — parent A cannot read parent B's students, intake_files, lesson_reports, or skill_ratings.
- **E2E (Playwright):** happy path — signup → onboarding fill → dashboard → logout → login → dashboard. Gated by env vars so CI can skip if not configured.
- Email delivery is mocked in tests (a no-op Resend client) to avoid real sends.

## CLAUDE.md Outline

Repo root `CLAUDE.md`:

1. **Project summary.**
2. **Stack:** Next 15, React 19, TS, Tailwind, Supabase (Auth/DB/Storage/RLS), Resend, Vercel.
3. **Commands:** `npm run dev/build/lint/test/test:e2e`, `supabase start/stop/db reset/db push`, `supabase gen types ...`.
4. **Folder map.**
5. **Auth & RLS model:** roles, how to promote, where policies live, onboarding gate.
6. **Theme tokens:** colors (including cyan), radii, fonts. **Brand font caveat** — Rimouski + Gill Sans Infant Std are the brand's official fonts; we ship with Nunito + Nunito Sans (matching the reference HTML) until font files are provided and self-hosted via `next/font/local`.
7. **Registration numbers:** format, generator function, sequence reset policy (none — year prefix avoids collisions).
8. **Intake form:** shape, validation, storage (structured columns + jsonb + intake-files bucket).
9. **Lesson reports:** shape, subject-skill seed data, email flow.
10. **Conventions:** server actions + zod, no secrets client-side, middleware guards, `requireParent` / `requireAdmin` / `requireOnboardingComplete`.
11. **Recipes:** add a protected page; add a new table with RLS; add skills for a new subject; tweak the email template.
12. **Env vars.**
13. **Deployment:** Vercel, Supabase migrations pipeline, Resend domain verification.

## Milestones (feed into the implementation plan)

1. Scaffold Next 15 + Tailwind + theme tokens + fonts.
2. Shared UI primitives + marketing home + pricing.
3. Supabase project, migrations (tables, RLS, storage, RPCs, seed), generated types.
4. `@supabase/ssr` clients + middleware + auth helpers.
5. Auth pages (login, signup, forgot-password).
6. Onboarding intake form (with Section 1 file upload) + RPC wiring.
7. Parent dashboard: children list, detail, enroll, settings.
8. Admin dashboard: students, enrollments queue, subjects CRUD.
9. Lesson reports: admin compose form + parent viewer + Resend email + retry.
10. Tests (zod unit, RLS SQL, Playwright smoke) + CLAUDE.md + Vercel deploy notes.

## Open Questions (resolve during implementation)

- Contact form destination — logging to server console is a stopgap; wire to Resend "contact" email later.
- Privacy / terms pages before public launch — not blocking MVP.
- Whether to introduce per-subject skill seeding UI for subjects added after launch. For now, subjects without seeded skills render with no skill tracker block in the report form and the full-report view.
- Whether intake-form edits after first submission should be versioned. For MVP: editable in place, no versioning.
