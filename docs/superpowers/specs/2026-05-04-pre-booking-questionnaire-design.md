# Pre-Booking Questionnaire — Design

**Date:** 2026-05-04
**Status:** Approved (pending user review)
**Author:** brainstorming session w/ Aashir

## Summary

Replace the current "Book a session" CTAs (which all link to a Google
Calendar URL stored in `globals.bookingUrl`) with a public questionnaire
form at `/book`. Submissions are persisted to a new
`public.booking_requests` table and forwarded by email to the admin
address already in `globals.adminEmail`. The form captures the **source**
of the click (which CTA the parent came from) so admin can tell whether a
lead came from the hero, the nav, or a specific pricing tier card.

There is **no admin UI** for the requests — the email is the workflow,
the table is just an outage-proof log.

## Goals

- Capture lead context before the parent picks a session time.
- Show admin which marketing surface drove the lead.
- Survive a Resend outage without losing data.
- Keep the public site shell consistent (Nav + Footer + marketing
  styling).

## Non-goals

- An admin list / review page for requests.
- Status pipeline (New → Contacted → Booked → Closed).
- Converting a request into an enrolled student record.
- Replacing the existing parent onboarding/intake flow at
  `/onboarding`.
- Touching `globals.bookingUrl` in the CMS — the field stays in the
  schema/admin form, it just stops being read by public CTAs.

## Architecture

```
┌────────────┐   click           ┌──────────────┐   submit (server     ┌───────────────────┐
│ Marketing  │ ─────────────────▶│  /book       │ ────action)─────────▶│ submitBooking-    │
│ CTAs       │  href="/book?     │  page        │   FormData            │  Request()        │
│ (Nav/Hero/ │   source=…"       │ (BookingForm)│                       │   action          │
│  Pricing)  │                   └──────────────┘                       └───────────────────┘
└────────────┘                                                                   │
                                                                                 │ Zod parse
                                                                                 │ honeypot check
                                                                                 ▼
                                                                          ┌──────────────┐
                                                                          │ booking_     │
                                                                          │ requests     │  (Supabase, anon INSERT)
                                                                          │ table        │
                                                                          └──────┬───────┘
                                                                                 │ insert ok
                                                                                 ▼
                                                                          ┌──────────────┐
                                                                          │ sendBooking- │
                                                                          │ RequestEmail │  (Resend, replyTo=parent)
                                                                          │  (best-      │
                                                                          │   effort)    │
                                                                          └──────┬───────┘
                                                                                 │
                                                                                 ▼
                                                                          redirect("/book/thanks")
```

## Source-of-click tracking

Each public CTA gets a stable string passed via `?source=…`.

| CTA location              | Source ID     | Human label (in email)                  |
|---------------------------|---------------|------------------------------------------|
| Hero primary CTA          | `hero`        | Home page · Hero CTA                     |
| Nav (desktop and mobile)  | `nav`         | Top navigation                           |
| Pricing card — 8 sessions | `pricing-8`   | Pricing page · 8 sessions plan           |
| Pricing card — 24 sessions| `pricing-24`  | Pricing page · 24 sessions plan          |
| Pricing card — 48 sessions| `pricing-48`  | Pricing page · 48 sessions plan          |
| Direct visit / unknown    | `direct`      | Direct visit (no source)                 |

`formatSource(source: string)` lives in `src/lib/booking/schema.ts` and
returns the human label. Unknown values fall back to `Direct visit (no
source)`.

The `source` query param is read in `BookingForm.tsx` (client) from
`useSearchParams()` and rendered as a hidden `<input>`. The server
action treats anything not in the known-source allowlist as `direct` to
keep the column tidy.

## Form fields

All client-side validation is duplicated server-side via the same Zod
schema (`bookingRequestSchema` in `src/lib/booking/schema.ts`).

| Field                  | Type     | Validation                                                 |
|------------------------|----------|-------------------------------------------------------------|
| Child's full name      | text     | `nonEmpty()`                                                |
| Age                    | number   | int, 3–19                                                   |
| Class / grade level    | text     | `nonEmpty()` (free-form, e.g. "Year 4", "JSS2")              |
| Curriculum             | enum     | one of `nigerian`, `british`, `american`, `canadian`, `other` |
| Curriculum (other)     | text     | required *only* if curriculum = `other`; else ignored        |
| Subject for trial      | enum     | one of `english`, `mathematics`, `science`                  |
| Learning needs         | textarea | trim, 5–1000 chars                                           |
| Current performance    | enum     | one of `excellent`, `good`, `average`, `needs_improvement`, `not_sure` |
| Areas of concern       | textarea | optional, max 1000                                           |
| Parent's full name     | text     | `nonEmpty()`                                                |
| Phone (WhatsApp)       | text     | trim, 6–30 (free-form to allow international formats)        |
| Email                  | email    | standard email validation                                   |
| `source` (hidden)      | text     | one of the known IDs above; else coerced to `direct`         |
| `_hp` (honeypot)       | text     | must be empty — non-empty submissions return `ok` silently    |

Curriculum and performance enums are stored as **lowercase snake_case**
in the DB; the UI maps to display labels (e.g. `needs_improvement` →
"Needs Improvement").

## Database

New migration: `supabase/migrations/0011_booking_requests.sql`

```sql
create table public.booking_requests (
  id                  uuid primary key default gen_random_uuid(),
  child_name          text not null,
  child_age           int  not null check (child_age between 3 and 19),
  child_grade         text not null,
  curriculum          text not null
                        check (curriculum in
                          ('nigerian','british','american','canadian','other')),
  curriculum_other    text,
  subject             text not null
                        check (subject in ('english','mathematics','science')),
  learning_needs      text not null,
  current_performance text not null
                        check (current_performance in
                          ('excellent','good','average','needs_improvement','not_sure')),
  concerns            text,
  parent_name         text not null,
  parent_phone        text not null,
  parent_email        text not null,
  source              text not null default 'direct',
  created_at          timestamptz not null default now()
);

create index booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

alter table public.booking_requests enable row level security;

-- Anon (and authenticated) can insert; nobody gets SELECT/UPDATE/DELETE
-- via API. Service role bypasses RLS, so admins can read/export from
-- the Supabase dashboard.
create policy "public can submit booking requests"
  on public.booking_requests
  for insert
  to anon, authenticated
  with check (true);
```

No `SELECT` policy is intentional — the table is write-only from the
public API surface. If admin ever needs a UI later, that's an additive
change (new policy + page).

## Server action — `submitBookingRequest(formData: FormData)`

Lives in `src/lib/actions/booking.ts`.

```ts
"use server";

export type SubmitBookingRequestResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };
```

Order of operations:

1. **Honeypot check** — if `_hp` is non-empty, return `{ ok: true }`
   without touching the DB. (Bots get a thank-you page; we don't even
   look at their input.)
2. **Coerce + parse** — pull every form field, coerce `child_age` to
   number, normalize `source` to a known ID or `direct`, run the Zod
   schema's `safeParse`. On failure, return `{ ok: false, fieldErrors }`
   keyed by field name.
3. **Conditional cross-field check** — if `curriculum === "other"` and
   `curriculum_other` is empty, push a `fieldErrors.curriculum_other`
   and return.
4. **Insert** — use the regular `createClient()` (anon) so the RLS
   policy above is exercised. On failure return
   `{ ok: false, formError: "Couldn't save your request. Please try
   again." }` and **do not** call Resend.
5. **Email (best-effort)** — call `sendBookingRequestEmail(parsed)`. If
   it returns `{ ok: false }`, swallow the error and `console.error` —
   the data is already in the DB, we don't want the parent to see a
   scary error.
6. **Redirect** — `redirect("/book/thanks")`. (Throws `NEXT_REDIRECT`,
   which Next.js handles.)

The action does NOT need `requireAdmin()` / `requireParent()` — it's
public.

## Email — `sendBookingRequestEmail`

`src/lib/email/sendBookingRequest.ts`, modeled directly after
`sendContactMessage.ts`:

- Skip when `RESEND_API_KEY` is unset (`{ ok: true, skipped: true }`).
- `to: globals.content.adminEmail`
- `replyTo: parsed.parent_email`
- `subject: \`[EduConnect booking] ${child_name} — ${subjectLabel} (${sourceLabel})\``
- HTML body: card layout matching the existing contact email — section
  for **Source** at the top (highlighted), then **Child**, **Curriculum
  + subject + performance**, **Learning needs**, **Concerns**,
  **Parent**.
- Plain-text body mirroring the same sections.
- All user-provided strings escaped via the same `escapeHtml()` helper.

## Pages

### `/book` (`src/app/book/page.tsx`)

Server component. Loads `globals` for the marketing shell, renders:

```tsx
<div className="mkt-root">
  <Nav mode="marketing" activeHref="/book" />
  <main id="main-content">
    <BookingForm />
  </main>
  <Footer mode="marketing" />
</div>
```

Note: `Nav` for `mode="marketing"` currently *requires* a `bookingUrl`
prop. We change `Nav`'s marketing-mode CTA to point at `/book?source=nav`
instead, and drop the `bookingUrl` prop from the marketing-mode union.
This is a small breaking change to the local component API; both
existing callers (`src/app/page.tsx`, `src/app/pricing/page.tsx`) are
updated to stop passing it.

### `/book` (client) — `BookingForm`

`src/components/booking/BookingForm.tsx`

- Single `<form action={submitBookingRequest}>` (server action wired via
  `useFormState` for field-level error rendering, plus `useFormStatus`
  for the submit button's pending state).
- Reads `?source=` via `useSearchParams()`; renders it as a hidden
  `<input name="source">`. If the param is missing or unrecognized,
  the value is `"direct"`. The server action re-validates against the
  known-source allowlist regardless of what the hidden input contained.
- Renders sections matching the user's brief: Child's Information,
  School Curriculum, Subject for trial, Learning Needs, Current
  Performance, Areas of concern, Parent/Guardian Information.
- Reuses the existing marketing/intake styling — `mkt-root` shell,
  `btn btn-coral` for the submit button, `eyebrow` and `accent` for
  section headings. No new global CSS classes are introduced; any
  form-specific styling lives in `src/app/globals.css` under a single
  `.booking-form` namespace if needed.
- Honeypot input rendered with `tabIndex={-1}` and visually hidden via
  inline `style={{ position: 'absolute', left: '-10000px' }}`.
- On `{ ok: true }`, the server action's `redirect()` lands the parent
  on `/book/thanks`, so no client-side success state is needed.

### `/book/thanks` (`src/app/book/thanks/page.tsx`)

Server component. Static content matching the user's exact wording:

> After booking, a tutor will be assigned to your child and you will
> receive a confirmation message on WhatsApp.
>
> During the trial session, the tutor will:
> - Teach a short interactive lesson
> - Assess your child's strengths and gaps
> - Share feedback and a recommended learning plan after the session.

Plus a "Back to home" link (`<a href="/">`).

## CTA changes

| File                                              | Before                       | After                                |
|---------------------------------------------------|------------------------------|--------------------------------------|
| `src/components/ui/Nav.tsx`                       | `href={bookingUrl}` (×2)      | `href="/book?source=nav"` (×2)       |
| `src/components/marketing/Hero.tsx`               | `href={bookingUrl}`           | `href="/book?source=hero"`           |
| `src/components/marketing/PricingTable.tsx`       | `href={bookingUrl}`           | ``href={`/book?source=pricing-${tier.sessions}`}`` |
| `src/app/page.tsx`                                | passes `bookingUrl`           | drops `bookingUrl` from Nav + Hero   |
| `src/app/pricing/page.tsx`                        | passes `bookingUrl`           | drops `bookingUrl` from Nav + PricingTable |

`target="_blank"` and `rel="noopener noreferrer"` are removed — the form
is internal, so we want the parent to stay in the same tab.

`globals.content.bookingUrl` and the admin form field stay as-is. They
are simply no longer read by public CTAs.

## Files

**New (7)**

- `supabase/migrations/0011_booking_requests.sql` — table + RLS
- `src/lib/booking/schema.ts` — Zod schema, enum lists, `formatSource`,
  display-label maps for curriculum/performance/subject
- `src/lib/actions/booking.ts` — `submitBookingRequest` server action
- `src/lib/email/sendBookingRequest.ts` — Resend send + HTML/text
  rendering
- `src/app/book/page.tsx` — public form page
- `src/app/book/thanks/page.tsx` — confirmation page
- `src/components/booking/BookingForm.tsx` — client form component

**Changed (5)**

- `src/components/ui/Nav.tsx` — drop `bookingUrl` from marketing-mode
  union; CTAs → `/book?source=nav`
- `src/components/marketing/Hero.tsx` — drop `bookingUrl` prop; primary
  CTA → `/book?source=hero`
- `src/components/marketing/PricingTable.tsx` — drop `bookingUrl` prop;
  per-tier CTA → `/book?source=pricing-${tier.sessions}`
- `src/app/page.tsx` — stop threading `bookingUrl` into Nav + Hero
- `src/app/pricing/page.tsx` — stop threading `bookingUrl` into Nav +
  PricingTable

**Untouched on purpose**

- `globalsSchema` and `globals.bookingUrl` — value remains in CMS, just
  no longer read by public CTAs. Avoids a needless schema migration and
  admin form change.

## Testing

- **Unit (Vitest)**:
  `src/lib/booking/__tests__/schema.test.ts`
  - Valid full submission parses.
  - Out-of-range age rejected.
  - `curriculum: "other"` without `curriculum_other` rejected.
  - `curriculum: "british"` ignores `curriculum_other` even if present.
  - `formatSource` mapping for each known ID + unknown.
- **Integration (manual / curl)**: post a `FormData` to the action via
  the form, confirm a row lands in `booking_requests` and an email
  arrives at `globals.adminEmail`.
- **Honeypot**: submitting with `_hp="x"` returns ok without a DB row
  or an email.

## Risks & open questions

1. **Phone validation is loose** (free-form 6–30 chars). International
   numbers are messy enough that a strict regex causes more pain than
   it solves. Admin will eyeball it. If spam becomes a problem we can
   tighten later.
2. **`bookingUrl` orphaned in CMS** — the admin will still see a
   "Booking URL" input on the globals form that no longer affects the
   public site. Acceptable for now; we can hide/remove it in a later
   pass once we're sure we don't want a "share calendar link directly"
   admin feature.
3. **Rate limiting** is not in scope. Honeypot is the only abuse
   mitigation. Vercel platform-level protections (BotID etc.) are not
   wired up here.
4. **No spam protection beyond honeypot** — a determined human can
   spam the form. If this becomes an issue, layer Cloudflare Turnstile
   or Vercel BotID later. Both are additive.
