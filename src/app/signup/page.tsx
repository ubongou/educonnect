import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title={
        <>
          Create your parent account.
        </>
      }
      subtitle="The next step after signing up is a short intake about your child."
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
