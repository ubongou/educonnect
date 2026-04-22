import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { PasswordForm } from "@/components/dashboard/PasswordForm";
import { getProfile, requireParent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type StudentSummary = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  registration_number: string;
  completed: number;
  scheduled: number;
};

export default async function DashboardAccountPage() {
  await requireParent("/dashboard/account");
  const profile = await getProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // profiles.renewal_at is only readable by self (RLS on profiles), so this
  // comes from getProfile's own row. We read it separately because the
  // CurrentProfile shape doesn't include it.
  const { data: me } = await supabase
    .from("profiles")
    .select("renewal_at")
    .eq("id", profile.id)
    .maybeSingle();

  const { data: childrenData } = await supabase
    .from("students")
    .select("id, full_name, preferred_name, registration_number, created_at")
    .order("created_at", { ascending: true });

  const children = childrenData ?? [];
  const ids = children.map((c) => c.id);

  const { data: sessions } = ids.length
    ? await supabase
        .from("sessions")
        .select("student_id, status")
        .in("student_id", ids)
    : { data: [] };

  const counts = new Map<string, { completed: number; scheduled: number }>();
  for (const s of sessions ?? []) {
    const k = (s as { student_id: string }).student_id;
    if (!counts.has(k)) counts.set(k, { completed: 0, scheduled: 0 });
    const bucket = counts.get(k)!;
    const status = (s as { status: string }).status;
    if (status === "completed") bucket.completed += 1;
    else if (status === "scheduled") bucket.scheduled += 1;
  }

  const summaries: StudentSummary[] = children.map((c) => {
    const b = counts.get(c.id) ?? { completed: 0, scheduled: 0 };
    return {
      id: c.id,
      full_name: c.full_name,
      preferred_name: c.preferred_name,
      registration_number: c.registration_number,
      completed: b.completed,
      scheduled: b.scheduled,
    };
  });

  const renewalAt = me?.renewal_at ?? null;

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Parent dashboard
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          Account
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Subscription status, session progress, and your contact details.
        </p>
      </div>

      {/* Subscription + Contact (side by side on desktop) */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
          <h2 className="mb-4 font-heading text-[14px] font-extrabold text-navy">
            Subscription
          </h2>
          <div className="flex items-center gap-3 rounded-md border-[1.5px] border-blue/40 bg-blue/10 px-4 py-3">
            <span className="h-2 w-2 rounded-pill bg-blue" />
            <div>
              <p className="font-heading text-[13px] font-extrabold text-navy">
                {renewalAt ? "Active" : "Not on a plan yet"}
              </p>
              <p className="mt-0.5 text-[12px] text-g600">
                {renewalAt
                  ? `Renews ${new Date(renewalAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "Speak to admin to set a renewal date."}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-g400">
            Billing integration is rolling out soon. Subscription changes happen over
            your usual channel for now.
          </p>
        </section>

        <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
          <h2 className="mb-6 font-heading text-[14px] font-extrabold text-navy">
            Contact details
          </h2>
          <ProfileForm
            defaultFullName={profile.full_name ?? ""}
            defaultPhone={profile.phone ?? ""}
            email={profile.email ?? ""}
          />
        </section>
      </div>

      {/* Session summary per child */}
      <section className="mt-8 rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
        <h2 className="mb-4 font-heading text-[14px] font-extrabold text-navy">
          Session summary
        </h2>
        {summaries.length === 0 ? (
          <p className="text-[14px] text-g600">
            Add a child to start tracking sessions.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {summaries.map((s) => {
              const total = s.completed + s.scheduled;
              return (
                <div key={s.id} className="rounded-md bg-g50 p-4">
                  <p className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                    {s.preferred_name ?? s.full_name}
                  </p>
                  <p className="mt-1 font-heading text-[24px] font-extrabold leading-none text-navy">
                    {s.completed}
                  </p>
                  <p className="mt-1 text-[11px] text-g600">
                    of {total} sessions
                    {s.scheduled > 0 ? ` · ${s.scheduled} upcoming` : ""}
                  </p>
                  <Link
                    href={`/dashboard/sessions?child=${s.id}`}
                    className="mt-2 inline-block font-heading text-[12px] font-semibold text-blue underline-offset-4 hover:underline"
                  >
                    View lessons
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Password — full width so the two form columns don't get squeezed */}
      <section className="mt-8 rounded-lg border-[1.5px] border-navy/10 bg-white p-6 md:max-w-[540px]">
        <h2 className="mb-6 font-heading text-[14px] font-extrabold text-navy">
          Password
        </h2>
        <PasswordForm />
      </section>

      <section className="mt-12 flex items-center justify-between rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-6">
        <div>
          <p className="font-heading text-[13px] font-extrabold text-navy">
            Active plan status
          </p>
          <p className="mt-1 text-[12px] text-g600">
            Need to pause lessons or change the schedule? Reach out to admin —
            all schedule edits happen there.
          </p>
        </div>
        <StatusBadge tone={renewalAt ? "blue" : "gray"}>
          {renewalAt ? "Active" : "No plan"}
        </StatusBadge>
      </section>
    </Container>
  );
}
