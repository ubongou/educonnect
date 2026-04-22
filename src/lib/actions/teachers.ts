"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { teacherCreateSchema } from "@/lib/validation";

type EchoedValues = {
  email: string;
  full_name: string;
  phone: string;
};

export type CreateTeacherState =
  | null
  | { status: "error"; error: string; values: EchoedValues }
  | {
      status: "created";
      credentials: { email: string; password: string; full_name: string };
    };

/**
 * Admin creates a teacher account.
 *
 * The public auth.signUp path would either require email confirmation (which
 * forces a round-trip the client wanted to skip) or leak that a teacher
 * chose their own password. Instead we use the service-role admin API to
 * create the user with the admin-chosen password, mark email_confirmed at
 * insert time, and then flip the auto-created profile row's role to
 * 'teacher' (the handle_new_user trigger defaults new profiles to 'parent').
 *
 * Returns a one-time credentials block on success so the admin UI can show
 * and copy the password to share with the teacher manually. We never store
 * or echo the password again.
 */
export async function createTeacher(
  _prev: CreateTeacherState,
  formData: FormData,
): Promise<CreateTeacherState> {
  const caller = await createClient();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) {
    return {
      status: "error",
      error: "Not signed in",
      values: { email: "", full_name: "", phone: "" },
    };
  }

  const { data: callerProfile } = await caller
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "admin") {
    return {
      status: "error",
      error: "Admin only",
      values: { email: "", full_name: "", phone: "" },
    };
  }

  const raw = Object.fromEntries(formData);
  const echo: EchoedValues = {
    email: typeof raw.email === "string" ? raw.email : "",
    full_name: typeof raw.full_name === "string" ? raw.full_name : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
  };

  const parsed = teacherCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      values: echo,
    };
  }

  const admin = createServiceRoleClient();

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
      },
    });
  if (createErr || !created.user) {
    return {
      status: "error",
      error: createErr?.message ?? "Failed to create teacher",
      values: echo,
    };
  }

  const { error: roleErr } = await admin
    .from("profiles")
    .update({
      role: "teacher",
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
    })
    .eq("id", created.user.id);
  if (roleErr) {
    // Try to clean up so we don't leave an orphan auth.user with parent role.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    return {
      status: "error",
      error: `Created auth user but failed to set role: ${roleErr.message}`,
      values: echo,
    };
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");

  return {
    status: "created",
    credentials: {
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: parsed.data.full_name,
    },
  };
}
