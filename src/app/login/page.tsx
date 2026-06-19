import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; email?: string; reset?: string }>;
}) {
  const { email, reset } = await searchParams;

  return (
    <AuthShell
      title={<>Welcome back.</>}
      subtitle="Sign in to see your child's progress and upcoming sessions."
      footer={
        <>
          New to Masani?{" "}
          <Link href="/signup" className="font-semibold text-navy underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {reset && (
        <p
          role="status"
          className="mb-5 rounded-md border-[1.5px] border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
        >
          Password updated. Sign in with your new password.
        </p>
      )}
      <LoginForm defaultEmail={email} />
      <p className="mt-5 text-center text-[13px]">
        <Link href="/forgot-password" className="text-g600 underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </AuthShell>
  );
}
