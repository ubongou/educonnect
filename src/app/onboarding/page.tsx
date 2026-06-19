import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntakeForm } from "@/components/intake/IntakeForm";
import { requireParent } from "@/lib/auth";

export default async function OnboardingPage() {
  await requireParent("/onboarding");

  return (
    <div className="min-h-screen bg-paper pb-24">
      <header className="bg-navy bg-dot-blue px-6 py-14 md:py-20">
        <Container>
          <Eyebrow className="text-yellow/80">Welcome to Masani</Eyebrow>
          <h1 className="mt-2 font-heading text-[clamp(28px,4vw,44px)] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
            Tell us about your child.
          </h1>
          <p className="mt-4 max-w-[580px] text-[16px] leading-[1.7] text-white/70">
            Eight short sections. Every answer helps us match the right teacher and tailor lessons
            to your child&apos;s pace. Only the first section&apos;s core fields are required — the
            rest are optional but make a real difference.
          </p>
        </Container>
      </header>

      <main className="mt-10 px-6">
        <Container>
          <IntakeForm />
        </Container>
      </main>
    </div>
  );
}
