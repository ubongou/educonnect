import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ChildTabs, type ChildTabOption } from "@/components/dashboard/ChildTabs";
import {
  ChildDashboardBody,
  isSubjectSlug,
} from "@/components/dashboard/ChildDashboardBody";
import {
  getParentChildren,
  pickChild,
  childTabColor,
} from "@/lib/dashboard/children";

export default async function DashboardOverview({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; subject?: string; requested?: string }>;
}) {
  const {
    child: childIdRaw,
    subject: subjectRaw,
    requested,
  } = await searchParams;
  const { children } = await getParentChildren("/dashboard");
  const selected = pickChild(children, childIdRaw);
  const showRequestedBanner = requested === "1";

  if (!selected) {
    // Middleware should have bounced empty-children parents to /onboarding,
    // but if we land here anyway show a minimal welcome state.
    return (
      <Container>
        <div className="mb-8">
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Parent dashboard
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
            Welcome to Masani
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            Add your first child to start tracking progress.
          </p>
        </div>
        <Button href="/dashboard/children/new">Add a child</Button>
      </Container>
    );
  }

  const selectedSubject = isSubjectSlug(subjectRaw) ? subjectRaw : "mathematics";

  const childOptions: ChildTabOption[] = children.map((c, i) => ({
    id: c.id,
    label: c.preferred_name ?? c.full_name,
    dotColor: childTabColor(i),
  }));

  const displayName = selected.preferred_name ?? selected.full_name;

  return (
    <Container>
      {showRequestedBanner && (
        <div
          role="status"
          className="mb-6 rounded-md border border-blue/30 bg-blue/10 px-4 py-3 text-[13px] text-navy"
        >
          <strong className="font-heading font-bold">Request sent.</strong>{" "}
          Admin will assign a teacher and you&apos;ll see new sessions appear
          under &ldquo;Upcoming.&rdquo;
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Parent dashboard
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
            Overview
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            Progress snapshot for {displayName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button href="/dashboard/children/new" variant="outline">
            Add another child
          </Button>
        </div>
      </div>

      <ChildTabs
        basePath="/dashboard"
        tabs={childOptions}
        activeId={selected.id}
      />

      <ChildDashboardBody
        studentId={selected.id}
        childDisplayName={displayName}
        childRegistrationNumber={selected.registration_number}
        selectedSubject={selectedSubject}
        subjectSlug={selectedSubject}
        subjectHref={(slug) => `/dashboard?child=${selected.id}&subject=${slug}`}
        variant="parent"
      />
    </Container>
  );
}
