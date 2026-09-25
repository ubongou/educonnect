import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

// Private or account pages: kept out of search results (robots.txt also
// blocks crawling them).
export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      title={
        <>
          Create your parent account.
        </>
      }
      subtitle="The next step after signing up is a short intake form."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-navy underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
