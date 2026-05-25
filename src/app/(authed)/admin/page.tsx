import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";

type StatCard = {
  label: string;
  value: number;
  href: string;
  hint: string;
};

export default async function AdminOverview() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [students, pendingEnrollments, recentReports] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("lesson_reports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
  ]);

  const cards: StatCard[] = [
    {
      label: "Students",
      value: students.count ?? 0,
      href: "/admin/students",
      hint: "View every student and their intake",
    },
    {
      label: "Pending enrollments",
      value: pendingEnrollments.count ?? 0,
      href: "/admin/enrollments",
      hint: "Parent-submitted subject requests awaiting review",
    },
    {
      label: "Reports · last 7 days",
      value: recentReports.count ?? 0,
      href: "/admin/reports",
      hint: "Lesson reports submitted in the past week",
    },
  ];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">Overview</h1>
        <p className="mt-2 text-[14px] text-g600">
          At-a-glance activity across students, enrollment requests, and recent reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col rounded-[28px] border border-line bg-white p-7 transition-colors hover:border-navy"
          >
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              {c.label}
            </p>
            <p className="mt-2 font-heading text-[48px] font-semibold leading-none tabular-nums text-navy">
              {c.value}
            </p>
            <p className="mt-4 text-[13px] leading-[1.5] text-g600">{c.hint}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-heading text-[13px] font-bold text-blue">
              View
              <svg
                viewBox="0 0 16 16"
                className="h-3 w-3 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path
                  d="M4 8h8M8 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
