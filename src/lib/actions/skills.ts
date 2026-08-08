"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { skillCreateSchema, skillUpdateSchema } from "@/lib/validation";

export type SkillMutationResult = { ok: true } | { ok: false; error: string };

export async function createSkill(
  subjectId: string,
  name: string,
  description?: string,
  sortOrder?: number,
): Promise<SkillMutationResult> {
  const parsed = skillCreateSchema.safeParse({
    subject_id: subjectId,
    name,
    description,
    sort_order: sortOrder,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid skill" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subject_skills").insert({
    subject_id: parsed.data.subject_id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    sort_order: parsed.data.sort_order ?? 0,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function updateSkill(
  id: string,
  input: { name: string; description?: string; sortOrder?: number },
): Promise<SkillMutationResult> {
  const parsed = skillUpdateSchema.safeParse({
    name: input.name,
    description: input.description,
    sort_order: input.sortOrder,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid skill" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("subject_skills")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      ...(parsed.data.sort_order !== undefined ? { sort_order: parsed.data.sort_order } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function archiveSkill(id: string, archived: boolean): Promise<SkillMutationResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subject_skills")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/subjects");
  return { ok: true };
}
