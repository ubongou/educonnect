// Seed a demo journey: 1 parent + 1 teacher + 1 child with a full chain of
// approved enrollment → past sessions + lesson reports → upcoming sessions.
// Idempotent: re-running deletes the two demo auth users (which cascades to
// everything they own) before re-creating the set.
//
// Run with:  bun --env-file=.env.local scripts/seed-demo.ts

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import type { Database } from "../src/types/db";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const admin = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const parentEmail = "parent.demo@joinmasani.com";
const teacherEmail = "teacher.demo@joinmasani.com";
const parentName = "Adaeze Okonkwo";
const teacherName = "Ayobola Adeyemi";
const childFullName = "Temi Coker";
const childPreferredName = "Temi";
const genPassword = () =>
  randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "") + "A1!";
const parentPassword = genPassword();
const teacherPassword = genPassword();

// ─── wipe prior demo data + users. Several FKs to profiles have no cascade
// (students.added_by, enrollments.requested_by/decided_by/teacher_id,
// sessions.teacher_id, lesson_reports.uploaded_by), so we have to clear rows
// owned by the parent *before* deleting the auth user or the DB blocks it.
async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data.users.find((u) => u.email === email)?.id ?? null;
}

const prevParentId = await findUserIdByEmail(parentEmail);
const prevTeacherId = await findUserIdByEmail(teacherEmail);

if (prevParentId) {
  // students cascade → intake_files, parent_students, enrollments → sessions,
  // lesson_reports → skill_ratings, student_documents
  await admin.from("students").delete().eq("added_by", prevParentId);
}
if (prevTeacherId) {
  // defensive: any lesson_report uploaded by the demo teacher that somehow
  // survived (e.g., attached to a student owned by a different parent)
  await admin.from("lesson_reports").delete().eq("uploaded_by", prevTeacherId);
  await admin.from("sessions").delete().eq("teacher_id", prevTeacherId);
  await admin
    .from("enrollments")
    .update({ teacher_id: null })
    .eq("teacher_id", prevTeacherId);
}
if (prevParentId) {
  const { error: delErr } = await admin.auth.admin.deleteUser(prevParentId);
  if (delErr) throw new Error("delete prior parent: " + delErr.message);
}
if (prevTeacherId) {
  const { error: delErr } = await admin.auth.admin.deleteUser(prevTeacherId);
  if (delErr) throw new Error("delete prior teacher: " + delErr.message);
}

// ─── create auth users ────────────────────────────────────────────────────────
const { data: parentCreate, error: parentCreateErr } =
  await admin.auth.admin.createUser({
    email: parentEmail,
    password: parentPassword,
    email_confirm: true,
    user_metadata: { full_name: parentName },
  });
if (parentCreateErr || !parentCreate.user) {
  throw new Error("parent createUser failed: " + parentCreateErr?.message);
}
const parentId = parentCreate.user.id;

const { data: teacherCreate, error: teacherCreateErr } =
  await admin.auth.admin.createUser({
    email: teacherEmail,
    password: teacherPassword,
    email_confirm: true,
    user_metadata: { full_name: teacherName },
  });
if (teacherCreateErr || !teacherCreate.user) {
  throw new Error("teacher createUser failed: " + teacherCreateErr?.message);
}
const teacherId = teacherCreate.user.id;

// ─── profiles: set names + roles + renewal_at on parent ──────────────────────
const renewalAt = new Date();
renewalAt.setMonth(renewalAt.getMonth() + 3);
const renewalDate = renewalAt.toISOString().slice(0, 10);

const { error: parentProfileErr } = await admin
  .from("profiles")
  .update({
    role: "parent",
    full_name: parentName,
    phone: "+44 7700 900123",
    renewal_at: renewalDate,
  })
  .eq("id", parentId);
if (parentProfileErr) throw new Error("parent profile: " + parentProfileErr.message);

const { error: teacherProfileErr } = await admin
  .from("profiles")
  .update({ role: "teacher", full_name: teacherName })
  .eq("id", teacherId);
if (teacherProfileErr) throw new Error("teacher profile: " + teacherProfileErr.message);

// ─── subjects + skills: upsert by slug ───────────────────────────────────────
type SubjectDef = { name: string; slug: string; skills: string[] };
const subjectDefs: SubjectDef[] = [
  {
    name: "Mathematics",
    slug: "mathematics",
    skills: [
      "Number sense",
      "Arithmetic accuracy",
      "Problem solving",
      "Fractions and decimals",
      "Speed and fluency",
      "Logical reasoning",
      "Algebra",
      "Geometry understanding",
      "Data interpretation",
    ],
  },
  {
    name: "English",
    slug: "english",
    skills: [
      "Reading fluency",
      "Reading comprehension",
      "Vocabulary development",
      "Grammar usage",
      "Sentence construction",
      "Spelling accuracy",
      "Writing clarity",
      "Oral expression",
    ],
  },
  {
    name: "Science",
    slug: "science",
    skills: [
      "Concept understanding",
      "Application of concepts",
      "Scientific reasoning",
      "Terminology usage",
      "Experiment and observation",
      "Problem solving in context",
    ],
  },
];

const subjectBySlug: Record<string, { id: string; skills: { id: string; name: string }[] }> = {};

for (const def of subjectDefs) {
  const { data: existing } = await admin
    .from("subjects")
    .select("id")
    .eq("slug", def.slug)
    .maybeSingle();
  let subjectId = existing?.id;
  if (!subjectId) {
    const { data: inserted, error: insertErr } = await admin
      .from("subjects")
      .insert({ name: def.name, slug: def.slug })
      .select("id")
      .single();
    if (insertErr || !inserted) throw new Error("subject " + def.slug + ": " + insertErr?.message);
    subjectId = inserted.id;
  }

  const { data: existingSkills } = await admin
    .from("subject_skills")
    .select("id, name")
    .eq("subject_id", subjectId);
  const existingNames = new Set((existingSkills ?? []).map((s) => s.name));

  const toInsert = def.skills
    .filter((n) => !existingNames.has(n))
    .map((n, i) => ({ subject_id: subjectId!, name: n, sort_order: i }));
  if (toInsert.length > 0) {
    const { error: skillsErr } = await admin.from("subject_skills").insert(toInsert);
    if (skillsErr) throw new Error("skills " + def.slug + ": " + skillsErr.message);
  }

  // Only look up the exact skill names this seed defines. A prior demo or
  // migration may have left differently-named siblings (e.g. "Fractions &
  // decimals" vs "Fractions and decimals") on the same subject; indexing by
  // sort_order would jumble ratings across both sets.
  const { data: allSkills } = await admin
    .from("subject_skills")
    .select("id, name")
    .eq("subject_id", subjectId)
    .in("name", def.skills);

  const byName = new Map((allSkills ?? []).map((s) => [s.name, s.id]));
  subjectBySlug[def.slug] = {
    id: subjectId,
    skills: def.skills.map((name) => ({ id: byName.get(name)!, name })),
  };
}

// ─── student + parent link + intake ──────────────────────────────────────────
const intake = {
  learning_background: {
    prior_tutoring: "no",
    recent_changes: "Switched to new school at start of this academic year.",
  },
  strengths: {
    enjoys_or_excels_at: "Reading and hands-on science experiments",
    confident_situations: "When working one-on-one with a teacher",
    interests: ["reading", "art", "music"],
  },
  challenges: {
    challenging_areas: "Multi-step maths problems and long division",
    struggling_subjects: "Maths — specifically fractions and decimals",
    response_when_difficult: "asks_for_help",
  },
  goals: {
    short_term: "Build confidence with fractions before end of term",
    long_term: "Score Grade 7+ in Maths at GCSE",
  },
};

function nextRegistrationNumber() {
  // mirror public.next_registration_number() format loosely — EC + 6 digits.
  return "EC" + String(Math.floor(100000 + Math.random() * 900000));
}

const { data: student, error: studentErr } = await admin
  .from("students")
  .insert({
    registration_number: nextRegistrationNumber(),
    full_name: childFullName,
    preferred_name: childPreferredName,
    age: 12,
    gender: "female",
    current_school: "Lagos Prep School",
    curriculum: "british",
    intake,
    intake_submitted_at: new Date().toISOString(),
    added_by: parentId,
  })
  .select("id")
  .single();
if (studentErr || !student) throw new Error("student: " + studentErr?.message);
const studentId = student.id;

await admin.from("parent_students").insert({ parent_id: parentId, student_id: studentId });

// ─── enrollment: Maths, approved, assigned to teacher ────────────────────────
const mathsSubject = subjectBySlug["mathematics"];
const { data: enrollment, error: enrollErr } = await admin
  .from("enrollments")
  .insert({
    student_id: studentId,
    subject_id: mathsSubject.id,
    requested_by: parentId,
    status: "approved",
    decided_by: parentId,
    decided_at: new Date().toISOString(),
    teacher_id: teacherId,
  })
  .select("id")
  .single();
if (enrollErr || !enrollment) throw new Error("enrollment: " + enrollErr?.message);
const enrollmentId = enrollment.id;

// ─── sessions: 5 past (completed w/ reports) + 2 upcoming ────────────────────
type LessonSeed = {
  daysAgo: number;
  focus: string;
  understanding: number; // 1..10
  confidence: number; // 1..10
  participation: number; // 0..10
  focusRating: number;
  homework: number;
  nextFocus: string;
  help: string;
  highlights: string;
  skills: number[]; // 0..10, same length as subject.skills
};

const lessons: LessonSeed[] = [
  {
    daysAgo: 140,
    focus: "Place value and rounding",
    understanding: 4,
    confidence: 3,
    participation: 6,
    focusRating: 6,
    homework: 4,
    nextFocus: "Multiplying decimals",
    help: "Place value worksheet page 4",
    highlights:
      "First session on decimals. Temi was hesitant but warmed up as we went. Place value understanding is solid — we'll build on this next week.",
    skills: [6, 4, 6, 4, 4, 4, 2, 4, 4],
  },
  {
    daysAgo: 105,
    focus: "Multiplying and dividing decimals",
    understanding: 6,
    confidence: 4,
    participation: 6,
    focusRating: 6,
    homework: 6,
    nextFocus: "Decimal word problems",
    help: "Decimal multiplication drill — 10 a day",
    highlights:
      "Temi was a little quieter than usual today but worked diligently. Division by decimals is a new concept and she is getting the hang of it.",
    skills: [6, 6, 6, 6, 6, 6, 2, 4, 6],
  },
  {
    daysAgo: 65,
    focus: "Word problems with decimals",
    understanding: 5,
    confidence: 5,
    participation: 6,
    focusRating: 8,
    homework: 8,
    nextFocus: "Adding fractions",
    help: "10 decimal word problems from worksheet",
    highlights:
      "Temi struggled with multi-step problems today. We slowed down and worked through the method together. She was more confident by the end.",
    skills: [6, 8, 8, 6, 6, 6, 4, 6, 6],
  },
  {
    daysAgo: 35,
    focus: "Adding and subtracting fractions",
    understanding: 7,
    confidence: 6,
    participation: 8,
    focusRating: 6,
    homework: 6,
    nextFocus: "Fractions and mixed numbers",
    help: "Fraction wall practice — 10 minutes daily",
    highlights:
      "Good session. Temi is getting comfortable with unlike denominators. She needed a few reminders to show her working.",
    skills: [8, 6, 8, 8, 6, 6, 4, 6, 6],
  },
  {
    daysAgo: 3,
    focus: "Fractions and mixed numbers",
    understanding: 9,
    confidence: 9,
    participation: 8,
    focusRating: 8,
    homework: 6,
    nextFocus: "Multiplying fractions",
    help: "10 min fraction worksheets daily",
    highlights:
      "Temi showed great improvement this week. Her confidence with fractions is noticeably stronger. She worked through 6 mixed number problems independently by the end of the session.",
    skills: [8, 6, 10, 10, 6, 8, 4, 6, 8],
  },
];

function isoOn(daysAgo: number, hour = 16) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

for (const l of lessons) {
  const scheduledAt = isoOn(l.daysAgo);
  const lessonDate = scheduledAt.slice(0, 10);

  // Stamp created_at so the teacher-home "Reports · last 7 days" tile actually
  // reflects when the lesson happened, not when the seed ran. Without this,
  // every seeded report looks like it was submitted today.
  const submittedAtIso = new Date(
    new Date(scheduledAt).getTime() + 60 * 60 * 1000,
  ).toISOString();

  const { data: session, error: sessionErr } = await admin
    .from("sessions")
    .insert({
      enrollment_id: enrollmentId,
      student_id: studentId,
      subject_id: mathsSubject.id,
      teacher_id: teacherId,
      scheduled_at: scheduledAt,
      session_date: lessonDate,
      duration_minutes: 60,
      status: "completed",
      created_at: scheduledAt,
    })
    .select("id")
    .single();
  if (sessionErr || !session) throw new Error("session seed: " + sessionErr?.message);

  const { data: report, error: reportErr } = await admin
    .from("lesson_reports")
    .insert({
      student_id: studentId,
      subject_id: mathsSubject.id,
      lesson_date: lessonDate,
      duration_minutes: 60,
      lesson_focus: l.focus,
      understanding_check: l.understanding,
      confidence_level: l.confidence,
      lesson_highlights: l.highlights,
      participation: l.participation,
      focus_rating: l.focusRating,
      homework: l.homework,
      next_focus: l.nextFocus,
      how_to_help_at_home: l.help,
      uploaded_by: teacherId,
      session_id: session.id,
      created_at: submittedAtIso,
    })
    .select("id")
    .single();
  if (reportErr || !report) throw new Error("lesson_report seed: " + reportErr?.message);

  const skillRows = l.skills.map((rating, i) => ({
    lesson_report_id: report.id,
    skill_id: mathsSubject.skills[i]!.id,
    rating,
  }));
  if (skillRows.length > 0) {
    const { error: skillRatingsErr } = await admin
      .from("lesson_report_skill_ratings")
      .insert(skillRows);
    if (skillRatingsErr) throw new Error("skill ratings: " + skillRatingsErr.message);
  }

  await admin
    .from("sessions")
    .update({ lesson_report_id: report.id })
    .eq("id", session.id);
}

// ─── student_documents: upload dummy files so the Documents page has rows ────
// Uses the real `student-documents` bucket so the signed-URL download route
// returns a working file, not a 404.
const docSeeds: Array<{ filename: string; kind: "test_paper" | "school_report" | "exam_result" | "other"; body: string }> = [
  {
    filename: "Term 2 Maths Test.pdf",
    kind: "test_paper",
    body: "Demo placeholder — Term 2 Maths Test for Temi Coker.\nThis is a seeded file used to populate the Documents UI.",
  },
  {
    filename: "End of Term Report.pdf",
    kind: "school_report",
    body: "Demo placeholder — End of Term school report for Temi Coker.\nThis is a seeded file used to populate the Documents UI.",
  },
];

for (const d of docSeeds) {
  const objectPath = `${studentId}/${crypto.randomUUID()}-${d.filename.replace(/\s+/g, "_")}`;
  const bytes = new TextEncoder().encode(d.body);
  const { error: uploadErr } = await admin.storage
    .from("student-documents")
    .upload(objectPath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadErr) throw new Error("doc upload " + d.filename + ": " + uploadErr.message);

  const { error: metaErr } = await admin.from("student_documents").insert({
    student_id: studentId,
    uploaded_by: parentId,
    kind: d.kind,
    original_filename: d.filename,
    storage_key: objectPath,
    mime_type: "application/pdf",
    size_bytes: bytes.byteLength,
    status: "ready",
  });
  if (metaErr) throw new Error("doc meta " + d.filename + ": " + metaErr.message);
}

// upcoming sessions so teacher + parent schedule pages have something
for (const offset of [2, 9]) {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + offset);
  scheduledAt.setHours(16, 0, 0, 0);
  await admin.from("sessions").insert({
    enrollment_id: enrollmentId,
    student_id: studentId,
    subject_id: mathsSubject.id,
    teacher_id: teacherId,
    scheduled_at: scheduledAt.toISOString(),
    session_date: scheduledAt.toISOString().slice(0, 10),
    duration_minutes: 60,
    status: "scheduled",
  });
}

// ─── done: print credentials ─────────────────────────────────────────────────
console.log("\n  ✔ Demo journey seeded");
console.log("  ─────────────────────────────");
console.log("  Parent");
console.log(`    Email:    ${parentEmail}`);
console.log(`    Password: ${parentPassword}`);
console.log(`    Name:     ${parentName}`);
console.log(`    Child:    ${childFullName} (${childPreferredName})`);
console.log("  ─────────────────────────────");
console.log("  Teacher");
console.log(`    Email:    ${teacherEmail}`);
console.log(`    Password: ${teacherPassword}`);
console.log(`    Name:     ${teacherName}`);
console.log("  ─────────────────────────────");
console.log("  Seeded: 5 past sessions with lesson reports + 2 upcoming");
console.log("  Login at: http://localhost:3000/login\n");
