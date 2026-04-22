"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubjectMutationResult =
  | { ok: true }
  | { ok: false; error: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createSubject(name: string): Promise<SubjectMutationResult> {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: false, error: "Enter a subject name." };

  const slug = slugify(trimmed);
  if (slug.length === 0) return { ok: false, error: "Subject name must contain letters or numbers." };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({ name: trimmed, slug });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function renameSubject(id: string, name: string): Promise<SubjectMutationResult> {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: false, error: "Enter a subject name." };

  const slug = slugify(trimmed);
  if (slug.length === 0) return { ok: false, error: "Subject name must contain letters or numbers." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ name: trimmed, slug })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function archiveSubject(
  id: string,
  archived: boolean,
): Promise<SubjectMutationResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/subjects");
  return { ok: true };
}
