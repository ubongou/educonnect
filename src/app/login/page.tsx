import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell
      title={<>Welcome back.</>}
      subtitle="Sign in to see your child's progress and upcoming sessions."
      footer={
        <>
          New to EduConnect?{" "}
          <Link href="/signup" className="font-semibold text-navy underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm defaultEmail={email} />
      <p className="mt-5 text-center text-[13px]">
        <Link href="/forgot-password" className="text-g600 underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </AuthShell>
  );
}
