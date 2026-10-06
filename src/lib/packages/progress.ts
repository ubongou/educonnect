/**
 * Teacher packages — the counting rules, kept pure so the teacher pages, the
 * admin inbox and the payments page all agree on what "almost out" means.
 *
 * Money-free on purpose: nothing here knows about rates or plans. A package is
 * a teacher's own count of a child's block of lessons.
 */

/** "Almost out" once this many lessons or fewer are left on an open package. */
export const ALMOST_OUT_THRESHOLD = 2;

export type PackageStatus = "open" | "complete" | "accepted";

export type PackageSession = {
  id: string;
  status: string; // scheduled | completed | cancelled | no_show
  session_date: string;
};

export type PackageTally = {
  size: number;
  /** Taught or no-show — both use up a lesson. */
  done: number;
  /** Scheduled lessons on the package that haven't happened yet. */
  booked: number;
  /** Cancelled lessons still sitting on the package; each needs replacing. */
  cancelled: number;
  /** Lessons the package still has room for (size − done − booked). */
  toBook: number;
  /** Lessons left to teach (size − done). */
  remaining: number;
};

export function isDone(status: string): boolean {
  return status === "completed" || status === "no_show";
}

export function tallyPackage(size: number, sessions: PackageSession[]): PackageTally {
  let done = 0;
  let booked = 0;
  let cancelled = 0;
  for (const s of sessions) {
    if (isDone(s.status)) done += 1;
    else if (s.status === "scheduled") booked += 1;
    else if (s.status === "cancelled") cancelled += 1;
  }
  return {
    size,
    done,
    booked,
    cancelled,
    toBook: Math.max(0, size - done - booked),
    remaining: Math.max(0, size - done),
  };
}

/**
 * Where an open package stands, from the office's point of view.
 *   out        — every lesson used; the teacher just hasn't confirmed yet
 *   almost_out — {@link ALMOST_OUT_THRESHOLD} or fewer left
 *   running    — plenty left
 */
export type Runway = "running" | "almost_out" | "out";

export function runwayFor(tally: PackageTally): Runway {
  if (tally.remaining === 0) return "out";
  if (tally.remaining <= ALMOST_OUT_THRESHOLD) return "almost_out";
  return "running";
}

/**
 * Confirming early (fewer lessons happened than the size, or some on the
 * package are still upcoming) needs a note. Mirrors teacher_package_confirm so
 * the form can say so before the round trip.
 */
export function confirmNeedsNote(tally: PackageTally): boolean {
  return tally.done < tally.size || tally.booked > 0;
}

export function canConfirm(tally: PackageTally): boolean {
  return tally.done > 0;
}

/**
 * Problems the office should see before accepting a confirmed package: a
 * lesson that is no longer marked as happened (its report was deleted, or it
 * was reset) can't be accepted — the database refuses too.
 */
export function reviewFlags(
  status: PackageStatus,
  sessions: PackageSession[],
): string[] {
  if (status !== "complete") return [];
  const notDone = sessions.filter((s) => !isDone(s.status)).length;
  return notDone > 0
    ? [
        `${notDone} lesson${notDone === 1 ? " is" : "s are"} no longer marked as happened — return it to the teacher.`,
      ]
    : [];
}

/**
 * Child + subject pairs that are having lessons with no open package: an
 * upcoming scheduled lesson that sits on no package, and no open package for
 * that enrollment. These are the families nobody is counting for.
 */
export function enrollmentsWithoutPackage(input: {
  openPackageEnrollmentIds: Iterable<string>;
  upcomingUnpackagedSessions: Array<{ enrollment_id: string }>;
}): Set<string> {
  const covered = new Set(input.openPackageEnrollmentIds);
  const out = new Set<string>();
  for (const s of input.upcomingUnpackagedSessions) {
    if (!covered.has(s.enrollment_id)) out.add(s.enrollment_id);
  }
  return out;
}

const RUNWAY_RANK: Record<Runway, number> = { out: 0, almost_out: 1, running: 2 };

/** Most urgent first: out, then almost out, then fewest lessons left. */
export function compareByUrgency(a: PackageTally, b: PackageTally): number {
  const r = RUNWAY_RANK[runwayFor(a)] - RUNWAY_RANK[runwayFor(b)];
  return r !== 0 ? r : a.remaining - b.remaining;
}

export function runwayLabel(runway: Runway): string {
  if (runway === "out") return "Out";
  if (runway === "almost_out") return "Almost out";
  return "Running";
}
