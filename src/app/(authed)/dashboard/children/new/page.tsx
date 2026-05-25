import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IntakeForm } from "@/components/intake/IntakeForm";

export default function AddAnotherChildPage() {
  return (
    <Container>
      <header className="mb-10">
        <div className="flex items-center gap-3 text-[13px] text-g600">
          <Link href="/dashboard" className="hover:text-navy">
            My children
          </Link>
          <span aria-hidden="true">›</span>
          <span className="font-semibold text-navy">Add another child</span>
        </div>
        <Eyebrow className="mt-6">New child</Eyebrow>
        <h1 className="mt-2 font-heading text-[clamp(26px,3.4vw,38px)] font-semibold leading-[1.1] text-navy">
          Tell us about this child.
        </h1>
        <p className="mt-3 max-w-[620px] text-[15px] leading-[1.7] text-g600">
          Same eight sections as before. Submitting creates a new registration number and returns
          you to your dashboard.
        </p>
      </header>

      <IntakeForm />
    </Container>
  );
}
