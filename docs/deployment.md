# EduConnect — Deployment guide

This is the one-time setup to take the platform from a clean Vercel + Supabase
account to a live deploy. Everything below assumes you already have:

- the `educonnect-lms` repo pushed to GitHub
- a Vercel account with the GitHub integration enabled
- a Supabase account
- (optional but recommended) a Resend account with a verified sending domain

If anything in here drifts, the source of truth for required env vars is the
top-level `.env.example` and `.env.local.example`.

---

## 1. Provision Supabase (production project)

1. **Create a new project** at https://app.supabase.com → "New project". Pick a
   region close to your users (Frankfurt for Nigeria/EU traffic).
2. **Push migrations** from this repo:
   ```bash
   bunx supabase login
   bunx supabase link --project-ref <your-project-ref>
   bun run db:push
   ```
   This applies every migration in `supabase/migrations/0001_init.sql` →
   `0007_teacher_rls.sql` to the cloud project.
3. **Create the storage buckets** (the migrations reference them, but bucket
   *creation* lives in `0003_storage.sql` — confirm they exist):
   - `intake-files` — private. Holds parent-uploaded curriculum / report
     PDFs from onboarding. Path pattern: `{student_id}/...`.
   - `student-documents` — private. Holds parent-uploaded test papers /
     reports from `/dashboard/documents`. Same path pattern.
4. **Verify RLS** is enabled on every public table:
   ```sql
   select relname, relrowsecurity
   from pg_class
   where relnamespace = 'public'::regnamespace and relkind = 'r';
   ```
   Every row should have `relrowsecurity = true`.
5. **Generate a service-role key** from Project Settings → API. Copy it — you'll
   paste it into Vercel as `SUPABASE_SERVICE_ROLE_KEY`. Treat it like a password.
6. **Seed an admin user** (one-time). The signup form only creates parents.
   Either:
   - SQL the role flip after signup:
     ```sql
     update public.profiles set role = 'admin' where email = 'you@example.com';
     ```
   - or run `bunx tsx scripts/create-teacher.ts` for a teacher account, then
     promote from SQL.

---

## 2. Provision Resend (transactional email)

1. **Sign up** at https://resend.com.
2. **Add and verify your sending domain** (DNS TXT + DKIM records). Resend's
   onboarding wizard walks you through it. Until the domain is verified you
   can use `onboarding@resend.dev` for testing — emails will land in spam from
   any production domain, so verify before launch.
3. **Create an API key** with `Full access` (or scope to "Send emails" only).
4. **Test send** locally:
   ```bash
   RESEND_API_KEY=re_... bun run dev
   # then submit a lesson report from /teacher/sessions
   ```

If `RESEND_API_KEY` is left unset, lesson-report submit still saves but the
email is skipped (logged with reason). Admins can manually trigger a resend
from `/admin/reports` once the key is configured.

---

## 3. Deploy to Vercel

1. **Import** the GitHub repo from the Vercel dashboard.
2. **Framework preset:** Next.js (autodetects).
3. **Build command:** `bun run build` (or leave as the Next.js default — both
   work, the build never reads env vars during compile beyond what's wired
   through `next.config.ts`).
4. **Environment variables** — add these to *Production*, *Preview*, and
   *Development* environments:

   | Variable | Source | Required |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key | ✅ |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | ✅ |
   | `RESEND_API_KEY` | Resend → API Keys | optional (recommended for prod) |
   | `RESEND_FROM` | e.g. `EduConnect <no-reply@joineduconnect.com>` | optional |
   | `APP_URL` | `https://your-domain.com` (no trailing slash) | ✅ for emails |

   **Never** add `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to a
   `NEXT_PUBLIC_` variable. They are server-side only.

5. **Deploy.** Vercel will build, push, and assign a `*.vercel.app` URL.
6. **Set `APP_URL` to the final domain** once you've connected your custom
   domain. Email links go through this value.

---

## 4. Post-deploy smoke checklist

Run through this once after the first production deploy and after any change
that touches auth, RLS, or the lesson-report pipeline.

- [ ] Open `https://<your-domain>/` — coming-soon page renders (or the
      marketing landing if you've merged `dev` to `main`)
- [ ] Sign up as a **new parent** at `/login` → `/signup` → onboarding flow
      completes through `/dashboard`
- [ ] Promote yourself to `admin` in SQL, sign in, hit `/admin` — overview
      counts populate
- [ ] Create a teacher from `/admin/teachers/new` — one-time password is
      shown; copy it
- [ ] Approve a parent enrollment from `/admin/enrollments` and assign the
      teacher in the same click
- [ ] Schedule a session at `/admin/schedule`
- [ ] Sign in as the teacher → `/teacher/sessions` → submit a lesson report
- [ ] Confirm the parent receives the lesson-report email
- [ ] `/admin/reports` shows the row with **Email · Sent** badge populated
- [ ] As the parent, open the link in the email → lands on
      `/dashboard/sessions?report=…` and renders the report

If any step fails, the **server logs in Vercel** (Functions tab) almost
always pinpoint the cause. RLS errors typically show as Supabase
`42501 permission denied` — re-check the policy SQL in
`supabase/migrations/0002_rls.sql` and `0007_teacher_rls.sql`.

---

## 5. Rollback

Vercel keeps every deployment. To roll back: Vercel project → Deployments
→ pick the prior good deploy → "Promote to Production".

Migrations are forward-only by convention. If a migration needs to be
reverted, write a new `00NN_undo_*.sql` migration and push it via
`bun run db:push` — never edit a published migration in place.
