import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Private or account pages: kept out of search results (robots.txt also
// blocks crawling them).
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No recovery session → the link expired or was opened in a different
  // browser. Send them back to forgot-password to request a fresh one.
  if (!user) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <AuthShell
      title={<>Set a new password.</>}
      subtitle="Choose something at least 8 characters. You'll be signed in again with your new password after this."
      footer={
        <>
          Changed your mind?{" "}
          <Link
            href="/login"
            className="font-semibold text-navy underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
