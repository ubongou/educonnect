# Per-Teacher Doc Routing + Lesson Report Email & Viewer Tweaks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Let parents route each uploaded document to one specific subject/teacher when their child has multiple approved enrollments; (2) restructure the lesson-report email so Lesson highlights, Next focus, and Help at home appear first; (3) reorder the in-app report viewer to surface Next focus + Help at home above the Understanding/Confidence card.

**Architecture:** Add a nullable `enrollment_id` FK on `public.student_documents` linking each upload to one approved enrollment (which carries `teacher_id`). RLS teacher-read narrows to that enrollment's teacher when set, with a transitional fallback for legacy NULL rows. App layer (Zod + server action) makes `enrollment_id` mandatory for all new inserts. The email template gains a `lessonHighlights` field and a new "Key takeaways" stack rendered before metrics. The report viewer JSX moves the narrative block above the metrics block.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres + RLS, `@supabase/ssr`, Zod, Tailwind CSS v4, Vitest. Plain-HTML email via Resend.

**Spec:** Live conversation, 2026-05-13. Decisions locked: per-enrollment routing, no "All teachers" option (picker is required), email reorders metrics below narrative.

---

## File map

**DB / schema:**
- Create: `supabase/migrations/0017_student_documents_enrollment.sql` — adds column, index, recreates teacher read policy.
- Regenerate: `src/types/db.ts` via `npm run db:types`.

**Server:**
- Modify: `src/lib/actions/documents.ts:34-147` — extend Zod schema with `enrollmentId`, validate against `enrollments` row (status approved, matches student), insert with the column set.
- Modify: `src/lib/email/sendLessonReport.ts:27-38, 105-119` — select `lesson_highlights`, pass through to template.
- Modify: `src/lib/email/templates/lessonReport.ts` — add `lessonHighlights` to data type, render new "Key takeaways" stack before metrics, drop the now-duplicated trailing Next focus / Help at home blocks (or keep just the CTA after metrics).

**Parent UI:**
- Modify: `src/app/(authed)/dashboard/documents/page.tsx` — fetch child's approved enrollments, pass them + the docs (now joined with subject name) to `DocumentUpload`.
- Modify: `src/components/dashboard/DocumentUpload.tsx` — add an enrollment `<select>` next to the Kind picker; require selection before file pick; show the assigned subject chip per uploaded doc.

**Teacher / admin UI:**
- Modify: `src/app/(authed)/teacher/students/[id]/page.tsx:99-103` — query docs filtered to the teacher's enrollments for this student (RLS handles auth; explicit filter keeps query intentional).
- Modify: `src/app/(authed)/admin/students/[id]/page.tsx` (if it lists docs) — join subject name for display.

**Report viewer:**
- Modify: `src/components/dashboard/LessonReportView.tsx:59-156` — move the narrative block (next focus + help at home, lines 134-156) up so it renders directly after the Lesson highlights card and before the metrics card.

**Tests:**
- Modify: `src/lib/__tests__/uploads.test.ts` or new — add cases for the Zod `enrollmentId` requirement.
- Optional: snapshot test for `renderLessonReportEmail` if one exists; otherwise a manual preview script.

---

## Task 1: Migration — add `enrollment_id` to `student_documents` and tighten RLS

**Files:**
- Create: `supabase/migrations/0017_student_documents_enrollment.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0017 — Per-teacher document routing.
--
-- Parents now choose which approved enrollment a document is for, so each
-- doc carries an enrollment_id (the enrollment row carries teacher_id, so
-- the teacher RLS clause narrows naturally).
--
-- The column is nullable: pre-existing rows from before this migration
-- keep NULL and remain visible to every teacher of the student during the
-- transition. The app layer (Zod) forbids new inserts without an
-- enrollment_id; admins may still write NULL via the service-role path
-- if ever needed.

alter table public.student_documents
  add column if not exists enrollment_id uuid
    references public.enrollments (id) on delete set null;

create index if not exists student_documents_enrollment_idx
  on public.student_documents (enrollment_id);

-- Recreate the read policy so teachers only see rows scoped to their own
-- enrollment, with a transitional fallback for legacy NULL rows.
drop policy if exists student_documents_read on public.student_documents;
create policy student_documents_read
  on public.student_documents for select
  using (
    public.is_admin(auth.uid())
    or uploaded_by = auth.uid()
    or (
      status = 'ready'
      and (
        exists (
          select 1 from public.parent_students ps
          where ps.student_id = student_documents.student_id
            and ps.parent_id = auth.uid()
        )
        or (
          -- Teacher view: scope by enrollment when set, fall back to
          -- "any teacher of the student" for legacy NULL rows.
          enrollment_id is not null
          and exists (
            select 1 from public.enrollments e
            where e.id = student_documents.enrollment_id
              and e.teacher_id = auth.uid()
              and e.status = 'approved'
          )
        )
        or (
          enrollment_id is null
          and exists (
            select 1 from public.enrollments e
            where e.student_id = student_documents.student_id
              and e.teacher_id = auth.uid()
              and e.status = 'approved'
          )
        )
      )
    )
  );
```

- [ ] **Step 2: Run migrations locally and verify**

Run: `npm run db:reset` (or `npx supabase db reset` — pick whichever the repo uses; check `package.json`).
Expected: migration 0017 applies cleanly with no errors.

- [ ] **Step 3: Sanity-check the policy in psql**

```bash
npx supabase db psql -c "\d+ public.student_documents" | grep enrollment_id
npx supabase db psql -c "select polname from pg_policy where polrelid = 'public.student_documents'::regclass;"
```

Expected: `enrollment_id` shows in the column list with FK to enrollments; `student_documents_read` is listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0017_student_documents_enrollment.sql
git commit -m "feat(db): scope student_documents to an enrollment"
```

---

## Task 2: Regenerate DB types

**Files:**
- Modify: `src/types/db.ts` (generated)

- [ ] **Step 1: Regenerate**

Run: `npm run db:types`
Expected: `src/types/db.ts` updates with `enrollment_id: string | null` on `student_documents.Row` and the `Insert` / `Update` shapes.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes (no new errors; we haven't started consuming the field yet).

- [ ] **Step 3: Commit**

```bash
git add src/types/db.ts
git commit -m "chore(types): regen db types for student_documents.enrollment_id"
```

---

## Task 3: Server action — require and validate `enrollmentId`

**Files:**
- Modify: `src/lib/actions/documents.ts`

- [ ] **Step 1: Extend the Zod schema**

Replace the `requestSchema` definition (lines 34-40):

```ts
const requestSchema = z.object({
  studentId: z.string().uuid("Invalid student id"),
  enrollmentId: z.string().uuid("Pick a subject"),
  kind: z.enum(allowedKinds, { message: "Pick a valid kind" }),
  mimeType: z.string().min(1, "Missing MIME type"),
  sizeBytes: z.number().int().positive(),
  originalFilename: z.string().min(1).max(255),
});
export type RequestUploadInput = z.infer<typeof requestSchema>;
```

- [ ] **Step 2: Validate the enrollment belongs to the student + is approved**

Inside `requestStudentDocumentUpload`, after the existing `getUser()` block and before storage-key generation, add:

```ts
const { data: enrollment, error: enrollErr } = await supabase
  .from("enrollments")
  .select("id, student_id, status")
  .eq("id", parsed.data.enrollmentId)
  .maybeSingle();

if (enrollErr || !enrollment) {
  return { ok: false, error: "Enrollment not found" };
}
if (enrollment.student_id !== parsed.data.studentId) {
  return { ok: false, error: "Enrollment does not match the selected child" };
}
if (enrollment.status !== "approved") {
  return { ok: false, error: "Pick an approved enrollment" };
}
```

- [ ] **Step 3: Include `enrollment_id` in the insert**

In the `.insert({ ... })` call (around line 102-112), add `enrollment_id: parsed.data.enrollmentId,`:

```ts
.insert({
  student_id: parsed.data.studentId,
  enrollment_id: parsed.data.enrollmentId,
  uploaded_by: user.id,
  kind: parsed.data.kind,
  original_filename: parsed.data.originalFilename.slice(0, 255),
  storage_key: storageKey,
  mime_type: parsed.data.mimeType,
  size_bytes: parsed.data.sizeBytes,
  status: "pending",
})
```

- [ ] **Step 4: Run type-check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/documents.ts
git commit -m "feat(actions): require enrollment_id on parent document upload"
```

---

## Task 4: Parent page — fetch approved enrollments + pass to component

**Files:**
- Modify: `src/app/(authed)/dashboard/documents/page.tsx`

- [ ] **Step 1: Extend the parallel query block**

Replace the `Promise.all([...])` call so we also fetch the child's approved enrollments and join the subject onto the docs list:

```ts
const [{ data }, { data: materialsData }, { data: enrollmentRows }] =
  await Promise.all([
    supabase
      .from("student_documents")
      .select(
        "id, kind, original_filename, size_bytes, uploaded_at, mime_type, enrollment_id, enrollments ( subjects ( name ) )",
      )
      .eq("student_id", selected.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("teacher_materials")
      .select("id, kind, original_filename, size_bytes, uploaded_at, mime_type")
      .eq("student_id", selected.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select("id, subjects ( name ), teacher:profiles!enrollments_teacher_id_fkey ( full_name )")
      .eq("student_id", selected.id)
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
  ]);
```

- [ ] **Step 2: Shape the enrollment options for the component**

After the query, derive a typed list:

```ts
type EnrollmentRow = {
  id: string;
  subjects: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

const enrollmentOptions = ((enrollmentRows ?? []) as unknown as EnrollmentRow[])
  .map((e) => ({
    id: e.id,
    subjectName: e.subjects?.name ?? "Subject",
    teacherName: e.teacher?.full_name ?? null,
  }));
```

- [ ] **Step 3: Extend the `UploadedDocument` mapping with the joined subject**

Replace the existing `documents` line with:

```ts
type DocRow = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
  enrollment_id: string | null;
  enrollments: { subjects: { name: string } | null } | null;
};

const documents: UploadedDocument[] = ((data ?? []) as unknown as DocRow[]).map(
  (d) => ({
    id: d.id,
    kind: d.kind,
    original_filename: d.original_filename,
    size_bytes: d.size_bytes,
    uploaded_at: d.uploaded_at,
    mime_type: d.mime_type,
    subjectName: d.enrollments?.subjects?.name ?? null,
  }),
);
```

- [ ] **Step 4: Pass `enrollments` to `DocumentUpload`**

Update the JSX render:

```tsx
<DocumentUpload
  studentId={selected.id}
  documents={documents}
  enrollments={enrollmentOptions}
/>
```

- [ ] **Step 5: Run type-check**

Run: `npx tsc --noEmit`
Expected: fails on `DocumentUpload` props (we haven't widened them yet) and possibly on `UploadedDocument.subjectName`. That's fine — Task 5 fixes it.

- [ ] **Step 6: Commit (after Task 5 typechecks)**

Defer the commit until Task 5 is in so the tree builds. Mentioned here only so steps stay paired.

---

## Task 5: `DocumentUpload` — enrollment picker + subject chip on list

**Files:**
- Modify: `src/components/dashboard/DocumentUpload.tsx`

- [ ] **Step 1: Widen `UploadedDocument` and add an `EnrollmentOption` type**

At the top of the file, replace the `UploadedDocument` export and add a new option type:

```ts
export type UploadedDocument = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
  subjectName: string | null;
};

export type EnrollmentOption = {
  id: string;
  subjectName: string;
  teacherName: string | null;
};
```

- [ ] **Step 2: Widen the component props**

Replace the `DocumentUpload({ studentId, documents })` signature with:

```tsx
export function DocumentUpload({
  studentId,
  documents,
  enrollments,
}: {
  studentId: string;
  documents: UploadedDocument[];
  enrollments: EnrollmentOption[];
}) {
```

- [ ] **Step 3: Track the chosen enrollment in state**

Add below the existing `const [kind, setKind] = ...` line:

```tsx
const [enrollmentId, setEnrollmentId] = useState<string>(
  enrollments[0]?.id ?? "",
);
```

- [ ] **Step 4: Guard the upload flow on enrollment presence**

At the top of `doUpload`, after the existing `setSuccess(null); setState(...)` lines, add:

```tsx
if (!enrollmentId) {
  setState({
    kind: "error",
    message: "Approve a subject enrollment for this child before uploading.",
  });
  return;
}
```

And include `enrollmentId` in the `requestStudentDocumentUpload` call:

```tsx
const req = await requestStudentDocumentUpload({
  studentId,
  enrollmentId,
  kind,
  mimeType: file.type,
  sizeBytes: file.size,
  originalFilename: file.name,
});
```

- [ ] **Step 5: Render the subject `<select>` next to Kind**

Inside the "Upload a new document" card, replace the existing single Kind label with a row of two:

```tsx
<div className="flex flex-wrap items-end gap-3">
  <label className="flex flex-col gap-[6px]">
    <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
      Subject
    </span>
    <select
      value={enrollmentId}
      onChange={(e) => setEnrollmentId(e.target.value)}
      className={`${inputBase} py-2 text-[13px]`}
      disabled={isBusy || enrollments.length === 0}
    >
      {enrollments.length === 0 ? (
        <option value="">No approved subjects yet</option>
      ) : (
        enrollments.map((e) => (
          <option key={e.id} value={e.id}>
            {e.subjectName}
            {e.teacherName ? ` · ${e.teacherName}` : ""}
          </option>
        ))
      )}
    </select>
  </label>
  <label className="flex flex-col gap-[6px]">
    <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
      Kind
    </span>
    <select
      value={kind}
      onChange={(e) => setKind(e.target.value as keyof typeof kindLabels)}
      className={`${inputBase} py-2 text-[13px]`}
      disabled={isBusy}
    >
      {Object.entries(kindLabels).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  </label>
</div>
```

(Drop the previous single `<label>` for Kind.)

- [ ] **Step 6: Disable the dropzone when no enrollment exists**

Wrap the dropzone in:

```tsx
{enrollments.length === 0 && (
  <p className="mb-3 rounded-md border-[1.5px] border-yellow/40 bg-yellow/10 px-3 py-2 text-[13px] font-semibold text-navy">
    Once your child has an approved subject enrollment, you can upload
    documents here.
  </p>
)}
```

And in the existing `<label ... className="...">` for the dropzone, change `isBusy ? "pointer-events-none opacity-60" : ""` to:

```tsx
isBusy || enrollments.length === 0 ? "pointer-events-none opacity-60" : ""
```

- [ ] **Step 7: Show the subject chip per uploaded doc**

In the `<li>` listing block, add a subject chip next to the existing kind chip:

```tsx
<StatusBadge tone="gray">{kindLabels[d.kind] ?? d.kind}</StatusBadge>
{d.subjectName && (
  <StatusBadge tone="blue">{d.subjectName}</StatusBadge>
)}
```

(Confirm `StatusBadge` supports `tone="blue"` — if not, use whichever neutral-accent tone the badge component exposes; check `src/components/ui/StatusBadge.tsx`.)

- [ ] **Step 8: Run type-check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 9: Run unit tests**

Run: `npm test -- uploads`
Expected: existing upload-policy tests still pass.

- [ ] **Step 10: Commit Tasks 4 + 5 together**

```bash
git add src/app/\(authed\)/dashboard/documents/page.tsx \
        src/components/dashboard/DocumentUpload.tsx
git commit -m "feat(parent): pick subject when uploading a document"
```

---

## Task 6: Teacher student page — filter docs by subject + show chip

**Files:**
- Modify: `src/app/(authed)/teacher/students/[id]/page.tsx`

RLS already hides cross-teacher docs. This task only adds the subject join so the teacher's doc list mirrors the parent UI's chip and the list is intentionally scoped on the query side too.

- [ ] **Step 1: Extend the doc select**

Replace the `student_documents` select line (currently `select("id, kind, original_filename, size_bytes, uploaded_at, mime_type")`) with:

```ts
.select(
  "id, kind, original_filename, size_bytes, uploaded_at, mime_type, enrollment_id, enrollments ( subjects ( name ) )",
)
```

- [ ] **Step 2: Add `subjectName` to the `DocumentRow` type and the render**

Find the existing `type DocumentRow` near the top of the file and add `subjectName: string | null;`. Map the joined column in the `(documents ?? []).map(...)` step (or do it inline where `docs` is built).

Where the teacher page renders each document row, add the same subject chip pattern from Task 5 Step 7.

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authed\)/teacher/students/\[id\]/page.tsx
git commit -m "feat(teacher): show subject chip on parent-uploaded documents"
```

---

## Task 7: Admin student page — surface subject chip if it lists docs

**Files:**
- Modify (if applicable): `src/app/(authed)/admin/students/[id]/page.tsx`

- [ ] **Step 1: Audit**

Run: `grep -n "student_documents" src/app/\(authed\)/admin/students/\[id\]/page.tsx`
Expected: shows where (if anywhere) docs are listed.

- [ ] **Step 2: If docs are listed, mirror Task 6 changes**

Same select extension and same chip render. If the admin page does not list docs, skip this task and commit nothing.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add src/app/\(authed\)/admin/students/\[id\]/page.tsx
git commit -m "feat(admin): show subject chip on student documents"
```

---

## Task 8: Email template — surface highlights/next focus/help at home FIRST

**Files:**
- Modify: `src/lib/email/templates/lessonReport.ts`
- Modify: `src/lib/email/sendLessonReport.ts`

The decision was: "Replace metrics-first order entirely." So the new email body order under the date/focus card is: Lesson highlights → Next focus → Help at home → Understanding/Confidence → Learning behaviours → CTA. The dark navy date/focus card stays as is.

- [ ] **Step 1: Add `lessonHighlights` to the email data type**

In `src/lib/email/templates/lessonReport.ts`, extend `LessonReportEmailData`:

```ts
export type LessonReportEmailData = {
  parentFirstName: string | null;
  studentName: string;
  subjectName: string;
  teacherName: string | null;
  lessonDate: string;
  lessonFocus: string;
  lessonHighlights: string | null;
  understanding: number;
  confidence: number;
  participation: number;
  focus: number;
  homework: number;
  nextFocus: string | null;
  howToHelpAtHome: string | null;
  reportUrl: string;
};
```

- [ ] **Step 2: Render a "Key takeaways" stack directly under the date card**

In the HTML body of `renderLessonReportEmail`, immediately after the closing `</table>` of the dark date/focus card (the one ending at "Subject · Teacher"), insert:

```ts
const keyTakeaways = [
  data.lessonHighlights
    ? `<p style="margin:24px 0 6px;font:800 11px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#7A8690;">Lesson highlights</p>
       <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};font-style:italic;">${escapeHtml(data.lessonHighlights)}</p>`
    : "",
  data.nextFocus
    ? `<p style="margin:20px 0 6px;font:800 11px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#7A8690;">Next focus</p>
       <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">${escapeHtml(data.nextFocus)}</p>`
    : "",
  data.howToHelpAtHome
    ? `<p style="margin:20px 0 6px;font:800 11px Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#7A8690;">Help at home</p>
       <p style="margin:0;font:400 14px Arial,sans-serif;line-height:1.55;color:${BRAND_NAVY};">${escapeHtml(data.howToHelpAtHome)}</p>`
    : "",
]
  .filter(Boolean)
  .join("");
```

Then splice `${keyTakeaways}` into the template right after the date/focus card and BEFORE the Understanding/Confidence two-column table.

- [ ] **Step 3: Remove the now-duplicated trailing Next focus / Help at home blocks**

Delete the two `${data.nextFocus ? ...}` and `${data.howToHelpAtHome ? ...}` blocks that currently render after Learning behaviours (lines 142-150 in the existing template). They are now shown above. Keep the CTA button block.

- [ ] **Step 4: Mirror the change in the plain-text fallback**

In the `text` array near the bottom, reorder so highlights/next focus/help at home appear before the ratings:

```ts
const text = [
  greeting.replace(/<[^>]+>/g, ""),
  "",
  `${data.teacherName ?? "Your child's teacher"} has just shared a new lesson report for ${data.studentName}.`,
  "",
  `${fmtDate(data.lessonDate)} — ${data.lessonFocus}`,
  `${data.subjectName}${data.teacherName ? ` · ${data.teacherName}` : ""}`,
  "",
  data.lessonHighlights ? `Lesson highlights:\n${data.lessonHighlights}\n` : "",
  data.nextFocus ? `Next focus:\n${data.nextFocus}\n` : "",
  data.howToHelpAtHome ? `Help at home:\n${data.howToHelpAtHome}\n` : "",
  `Understanding: ${data.understanding}/10 (${u.label})`,
  `Confidence:    ${data.confidence}/10 (${c.label})`,
  "",
  `Participation: ${data.participation}/10`,
  `Focus:         ${data.focus}/10`,
  `Homework:      ${data.homework}/10`,
  "",
  `View the full report: ${data.reportUrl}`,
  "",
  "— EduConnect",
]
  .filter(Boolean)
  .join("\n");
```

- [ ] **Step 5: Fetch `lesson_highlights` in `sendLessonReport.ts`**

In the `.select(` block (currently lines 27-38), add `lesson_highlights` to the column list:

```ts
.select(
  `
  id, lesson_date, lesson_focus, lesson_highlights,
  understanding_check, confidence_level,
  participation, focus_rating, homework,
  next_focus, how_to_help_at_home,
  student_id,
  students ( full_name, preferred_name ),
  subjects ( name ),
  uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name )
  `,
)
```

- [ ] **Step 6: Pass it through to the template**

In the `data: LessonReportEmailData = { ... }` literal inside the recipient loop, add:

```ts
lessonHighlights: report.lesson_highlights,
```

- [ ] **Step 7: Render a local preview HTML to eyeball the layout**

Run from repo root:

```bash
node -e "
const { renderLessonReportEmail } = require('./src/lib/email/templates/lessonReport.ts');
const { html } = renderLessonReportEmail({
  parentFirstName: 'Ubongabasi',
  studentName: 'Mary',
  subjectName: 'Mathematics',
  teacherName: 'Saria Ahmed',
  lessonDate: '2026-05-12',
  lessonFocus: 'Fractions intro',
  lessonHighlights: 'Mary cracked equivalent fractions confidently.',
  understanding: 5,
  confidence: 5,
  participation: 5,
  focus: 5,
  homework: 5,
  nextFocus: 'Mixed numbers.',
  howToHelpAtHome: 'Practice halves and quarters with food at dinner.',
  reportUrl: 'https://www.joineduconnect.com/dashboard/sessions?report=abc',
});
require('fs').writeFileSync('/tmp/email-preview.html', html);
console.log('wrote /tmp/email-preview.html');
"
```

If `node -e` requiring a `.ts` file fails (likely — Node doesn't load TS directly), run this through `tsx` instead: `npx tsx -e "..."`. Then open `/tmp/email-preview.html` in a browser.

Expected: order is date card → highlights italic → next focus → help at home → Understanding/Confidence → Learning behaviours → CTA.

- [ ] **Step 8: Run typecheck**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add src/lib/email/templates/lessonReport.ts src/lib/email/sendLessonReport.ts
git commit -m "feat(email): surface highlights/next focus/help at home before metrics"
```

---

## Task 9: Report viewer — move Next focus + Help at home above Understanding/Confidence

**Files:**
- Modify: `src/components/dashboard/LessonReportView.tsx`

Current order: header → Lesson highlights → Understanding/Confidence → Behaviours → Skills → Next focus + Help at home.

Target order: header → Lesson highlights → Next focus + Help at home → Understanding/Confidence → Behaviours → Skills.

- [ ] **Step 1: Move the narrative block**

In `LessonReportView.tsx`, cut the entire "Narrative — next focus + help at home" block (currently lines 134-156, the `{(report.next_focus || report.how_to_help_at_home) && ( ... )}` block) and paste it immediately after the "Lesson highlights" block (after the `{report.lesson_highlights && ( ... )}` closing on line 57) and before the "Key metrics" block (starts at line 60).

Also update the inline comment on the metrics block — currently `{/* Key metrics */}` — leave as is; but update the comment on the moved block from `{/* Narrative — next focus + help at home (highlights now shown above) */}` to `{/* Next focus + help at home — surfaced above metrics per client feedback */}`.

- [ ] **Step 2: Visual check across all three viewers**

The component is shared by parent (`/dashboard/reports/[id]`), admin (`/admin/reports/[id]`), and teacher (`/teacher/reports/[id]`) pages. Boot the dev server:

Run: `npm run dev`
Then load (in your browser) one report URL from each of the three role contexts and confirm the new section order.

Expected: in every viewer, the cards stack as Highlights → Next focus + Help at home → Understanding/Confidence → Behaviours → Skill tracker.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/LessonReportView.tsx
git commit -m "feat(report): move next focus + help at home above metrics card"
```

---

## Task 10: Tests + verification

**Files:**
- Modify or create: `src/lib/__tests__/uploads.test.ts`

- [ ] **Step 1: Add a Zod-shape test for `enrollmentId`**

Open `src/lib/__tests__/uploads.test.ts`. If it does not currently import the upload schema, add a small describe block that imports `requestSchema` (you may need to export it from `documents.ts` for testability — if you'd rather not export, skip this step and rely on the integration check in Step 3).

```ts
import { describe, it, expect } from "vitest";
import { requestSchema } from "@/lib/actions/documents";

describe("requestStudentDocumentUpload schema", () => {
  it("rejects payloads without enrollmentId", () => {
    const result = requestSchema.safeParse({
      studentId: "00000000-0000-0000-0000-000000000001",
      kind: "test_paper",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      originalFilename: "x.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete payload", () => {
    const result = requestSchema.safeParse({
      studentId: "00000000-0000-0000-0000-000000000001",
      enrollmentId: "00000000-0000-0000-0000-000000000002",
      kind: "test_paper",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      originalFilename: "x.pdf",
    });
    expect(result.success).toBe(true);
  });
});
```

If `requestSchema` isn't exported, add `export` to its declaration in `documents.ts` and re-run typecheck.

- [ ] **Step 2: Run the suite**

Run: `npm test`
Expected: all tests pass, including the two new ones.

- [ ] **Step 3: End-to-end smoke check**

Start dev: `npm run dev`. As a parent user with a child that has **two** approved enrollments (seed one if needed):

1. Visit `/dashboard/documents`.
2. Confirm the Subject `<select>` is populated with both subjects.
3. Upload one PDF for each subject.
4. Log in as the English teacher → open `/teacher/students/<id>` → confirm only the English-tagged doc appears, with the subject chip.
5. Log in as the Science teacher → confirm the Science-tagged doc appears only.
6. As admin, confirm both docs appear with chips.

If a teacher sees the other teacher's doc, RLS is mis-firing — re-check Task 1 Step 1 policy clauses.

- [ ] **Step 4: Trigger a test email**

Log in as the teacher, compose and submit a lesson report with **all** of: lesson highlights, next focus, help at home filled in.

Check the inbox: the email body should show Highlights → Next focus → Help at home BEFORE the Understanding/Confidence ratings, with the dark date/focus card unchanged at the top.

- [ ] **Step 5: Commit any test additions**

```bash
git add src/lib/__tests__/uploads.test.ts src/lib/actions/documents.ts
git commit -m "test(uploads): enforce enrollmentId on the request schema"
```

---

## Task 11: Deploy to production

- [ ] **Step 1: Push the branch**

```bash
git push origin dev
```

(Then merge dev → main per your usual flow before promoting, or deploy directly from dev with `vercel --prod` as you did today.)

- [ ] **Step 2: Apply the migration on the production Supabase project**

Either via the Supabase dashboard SQL editor or `npx supabase db push --linked` (whichever is the repo's deploy path). The app code does not depend on the new column being non-null, so order of operations is safe: migration first, then deploy, then test.

- [ ] **Step 3: Deploy**

Run: `vercel --prod`
Expected: READY state; smoke-check the parent /dashboard/documents page in prod.

- [ ] **Step 4: Final commit / PR**

If you opened a PR, request review per `superpowers:requesting-code-review`. Otherwise note the deploy URL and move on.

---

## Self-review notes

- **Spec coverage:** All three client asks (#1 doc routing, #2 email key takeaways first, #3 viewer reorder) have a dedicated task.
- **Legacy data:** Pre-existing `student_documents` rows have `enrollment_id = NULL` and remain visible to every teacher of the student via the fallback RLS clause. This is by design — they can stay NULL forever or be backfilled manually by an admin later.
- **Subject chip tone:** Task 5 Step 7 uses `tone="blue"` on `StatusBadge`. If that tone isn't exported, swap for `"gray"` and rely on label alone — the chip remains informative.
- **Email font-style italic:** matches the in-app "Lesson highlights" italic styling in the viewer (line 53). Visual consistency.
- **No-enrollment edge case:** A parent who adds a child but has no approved enrollments sees a yellow notice and a disabled dropzone — they cannot upload until admin approves an enrollment. This is intentional given the "force a picker" decision.
