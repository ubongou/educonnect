import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  return (
    <AuthShell
      title={<>Reset your password.</>}
      subtitle="Enter the email tied to your Masani account — we'll email you a link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-navy underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {expired && (
        <p
          role="status"
          className="mb-5 rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          That reset link is no longer valid. Request a fresh one below.
        </p>
      )}
      <ForgotPasswordForm />
    </AuthShell>
  );
}
