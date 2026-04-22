import { Container } from "@/components/ui/Container";

export default function TeacherOverview() {
  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">Overview</h1>
        <p className="mt-2 text-[14px] text-g600">
          Your assigned students, today&apos;s sessions, and the lesson-report composer
          will land here in the next build.
        </p>
      </div>

      <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-12 text-center">
        <p className="text-[14px] text-g600">
          Coming next: today&apos;s sessions, my students, and the lesson report composer.
        </p>
      </div>
    </Container>
  );
}
