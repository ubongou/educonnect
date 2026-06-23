import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAppUrl, getFromAddress, getResend } from "./client";
import { renderTeacherMaterialEmail } from "./templates/teacherMaterial";

export type SendTeacherMaterialResult =
  | { ok: true; recipients: string[]; skipped: false }
  | { ok: true; recipients: string[]; skipped: true; reason: string }
  | { ok: false; error: string };

const KIND_LABELS: Record<string, string> = {
  lesson_material: "Lesson material",
  homework: "Homework",
  demo_video: "Demo video",
  photo: "Photo",
  other: "File",
};

/**
 * Notifies every parent of a student that a teacher has shared a new
 * material. Loads via service-role (RLS bypass), stamps
 * `teacher_materials.emailed_at` on success, and is idempotent: a material
 * that already has `emailed_at` set is skipped. Mirrors
 * {@link import('./sendLessonReport').sendLessonReportEmail}.
 */
export async function sendTeacherMaterialEmail(
  materialId: string,
): Promise<SendTeacherMaterialResult> {
  const supabase = createServiceRoleClient();

  const { data: material, error: matErr } = await supabase
    .from("teacher_materials")
    .select(
      `
      id, kind, original_filename, note, emailed_at, student_id,
      students ( full_name, preferred_name ),
      uploader:profiles!teacher_materials_uploaded_by_fkey ( full_name )
      `,
    )
    .eq("id", materialId)
    .maybeSingle();

  if (matErr || !material) {
    return { ok: false, error: matErr?.message ?? "Material not found" };
  }
  if (material.emailed_at) {
    return {
      ok: true,
      recipients: [],
      skipped: true,
      reason: "Already notified",
    };
  }

  const { data: parents, error: parentsErr } = await supabase
    .from("parent_students")
    .select(
      `parent:profiles!parent_students_parent_id_fkey ( id, full_name, email )`,
    )
    .eq("student_id", material.student_id);

  if (parentsErr) return { ok: false, error: parentsErr.message };

  type ParentRow = {
    parent: { id: string; full_name: string | null; email: string | null } | null;
  };

  const recipients = ((parents ?? []) as unknown as ParentRow[])
    .map((p) => p.parent)
    .filter((p): p is NonNullable<ParentRow["parent"]> => Boolean(p?.email))
    .map((p) => ({ email: p.email!, fullName: p.full_name }));

  if (recipients.length === 0) {
    return {
      ok: true,
      recipients: [],
      skipped: true,
      reason: "No parent emails on file for this student",
    };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: true,
      recipients: recipients.map((r) => r.email),
      skipped: true,
      reason: "RESEND_API_KEY not set",
    };
  }

  const studentRow = material.students as
    | { full_name: string; preferred_name: string | null }
    | null;
  const teacherRow = material.uploader as { full_name: string | null } | null;

  const studentName =
    studentRow?.preferred_name?.trim() || studentRow?.full_name || "your child";
  const teacherName = teacherRow?.full_name ?? null;
  const kindLabel = KIND_LABELS[material.kind] ?? "File";

  const documentsUrl = `${getAppUrl().replace(/\/$/, "")}/dashboard/documents?child=${material.student_id}`;

  let allOk = true;
  let firstError: string | null = null;
  const sentTo: string[] = [];

  for (const r of recipients) {
    const { subject, html, text } = renderTeacherMaterialEmail({
      parentFirstName: r.fullName?.split(/\s+/)[0] ?? null,
      studentName,
      teacherName,
      kindLabel,
      originalFilename: material.original_filename,
      note: material.note,
      documentsUrl,
    });

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: r.email,
      subject,
      html,
      text,
    });

    if (error) {
      allOk = false;
      firstError ??= error.message ?? "Resend send failed";
      continue;
    }
    sentTo.push(r.email);
  }

  if (sentTo.length > 0) {
    await supabase
      .from("teacher_materials")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", materialId);
  }

  if (!allOk && sentTo.length === 0) {
    return { ok: false, error: firstError ?? "All sends failed" };
  }

  return { ok: true, recipients: sentTo, skipped: false };
}
