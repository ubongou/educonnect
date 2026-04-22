@AGENTS.md

## Role matrix

The app has three authenticated roles. Cross-role access 404s via
`requireParent` / `requireAdmin` / `requireTeacher` (see `src/lib/auth.ts`).

| Role    | Home       | Can                                                                                                                              | Cannot                                       |
|---------|------------|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| parent  | `/dashboard` | Self-signup. Onboard a child (intake). Request subject enrollments. Upload student documents. View their child's reports + next sessions. Edit own profile + password. | See other parents' children, manage subjects, teachers, or the schedule. |
| teacher | `/teacher` | Admin-created account (service-role via `createTeacher`). See assigned students + documents + schedule. Compose lesson reports (which also marks the session `completed`). | Self-signup. Write outside their own enrollments. Schedule sessions. Create teachers or subjects. |
| admin   | `/admin` | Everything. Creates teacher accounts, approves enrollments (picks a teacher in the same click), CRUDs subjects, schedules sessions, reads all reports. | n/a |

## Rating scales

Lesson reports use two scales. Callers must respect them:

- **Understanding + confidence — 1..10** bucketed into six named levels via
  `src/lib/scales.ts` (`understandingLabel`, `confidenceLabel`, `bucket6`).
  UI: `RatingScaleSlider` (teacher compose) + `StatusBadge` reading
  `understandingBadge(v) / confidenceBadge(v)` on read views.
- **Behaviours + per-skill ratings — 0..10** (participation, focus, homework,
  `lesson_report_skill_ratings.rating`). UI: `BatteryBars` with `max={10}`;
  it auto-narrows segments when `max > 5`.

Zod guards (`src/lib/validation.ts::rating1to10` / `rating0to10`) and the
DB CHECK constraints (migration 0006) both enforce these ranges — if one
drifts, all three must drift together.

## Key data paths

- Teacher gets assigned to an enrollment via `enrollments.teacher_id` — set
  by `decideEnrollment(id, "approved", teacherId)` (see
  `src/lib/actions/enrollments.ts`). A teacher's "My students" is derived
  from distinct `student_id`s across their approved enrollments.
- Sessions (`public.sessions`) are admin-scheduled, one-off, linked to a
  specific enrollment. Teacher report submission goes through the
  `create_lesson_report` RPC with `p_session_id`, which marks the session
  `completed` and back-links `lesson_report_id` atomically.
- Parent uploads (`public.student_documents`, bucket `student-documents`)
  are separate from intake uploads (`public.intake_files`, bucket
  `intake-files`). RLS on both follows the same `{student_id}/...`
  storage-path pattern; the download route is
  `src/app/api/student-documents/[id]/download/route.ts`.

## Non-obvious conventions

- Commit author: `Bassamnaeem <bassamnaeem01@gmail.com>`. Never add the
  Claude co-author trailer.
- Never push without explicit user approval ("push"). Commit locally.
- Client-requested brand wordmarks live at `/brand/logo-blue.png` and
  `/brand/logo-white.png`; the `BrandLogo` component picks per background.
- Turbopack's workspace root is pinned to the project via `next.config.ts`
  because a stray `package.json` higher up the tree would otherwise
  bubble up and break CSS resolution.
- The scope-change plan lives at
  `/Users/hashpotato/.claude/plans/abstract-dazzling-crystal.md`.
  It supersedes Task 29 in
  `docs/superpowers/plans/2026-04-16-educonnect-lms.md`.
