"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation";

type EchoedValues = {
  full_name: string;
  email: string;
  phone: string;
};

export type SignupState =
  | null
  | { status: "error"; error: string; values: EchoedValues }
  | { status: "check-email"; email: string };

/**
 * Create a parent account.
 *
 * Two success paths depending on the Supabase project's auth config:
 *   • Email confirmation disabled → session established → redirect to
 *     /onboarding (the happy path the app was originally built around).
 *   • Email confirmation enabled → no session yet → return a
 *     `check-email` state so the form can tell the user to finish
 *     confirming. Redirecting to /onboarding in this case drops them
 *     at /login?from=/onboarding with no context.
 *
 * On any validation or server error we echo the submitted values
 * (except the password) back to the client so the form doesn't wipe.
 */
export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const raw = Object.fromEntries(formData);
  const echo: EchoedValues = {
    full_name: typeof raw.full_name === "string" ? raw.full_name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      values: echo,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
      },
    },
  });

  if (error) {
    return { status: "error", error: error.message, values: echo };
  }

  if (!data.session) {
    return { status: "check-email", email: parsed.data.email };
  }

  redirect("/onboarding");
}
