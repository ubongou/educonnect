import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TeacherCreateForm } from "@/components/admin/TeacherCreateForm";

export default function NewTeacherPage() {
  return (
    <Container className="max-w-[620px]">
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/admin/teachers" className="hover:text-navy">
          Teachers
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">New teacher</span>
      </div>

      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          Create a teacher account
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          You pick the email and password. Once the account is created the teacher can sign
          in immediately — share the credentials over your usual channel. We won&apos;t show
          the password again after this screen.
        </p>
      </div>

      <TeacherCreateForm />
    </Container>
  );
}
