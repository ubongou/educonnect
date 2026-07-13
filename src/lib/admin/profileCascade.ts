// Shared, framework-agnostic helpers for the teacher/parent permanent-delete
// flow. Kept out of the "use server" actions file so the plain (sync) helpers
// and the type can be imported by both the server action and client UI.

/** Counts of what references a profile. Every one of these FK columns blocks a
 *  plain profile delete (NO ACTION, nullable or not), so a non-zero total means
 *  deletion needs the force teardown. `lesson_reports.edited_by` is
 *  ON DELETE SET NULL, so it's deliberately excluded. */
export type ProfileCascade = {
  sessions: number;
  reports: number;
  materials: number;
  messages: number;
  enrollmentsAssigned: number; // enrollments.teacher_id — unassigned on force
  enrollmentsRequested: number; // enrollments.requested_by — deleted on force
  documents: number; // student_documents.uploaded_by
};

export function profileCascadeTotal(c: ProfileCascade): number {
  return (
    c.sessions +
    c.reports +
    c.materials +
    c.messages +
    c.enrollmentsAssigned +
    c.enrollmentsRequested +
    c.documents
  );
}

/** Human-readable bullet lines describing what a force-delete removes, for the
 *  confirm dialog's cascade list. */
export function profileCascadeLines(c: ProfileCascade): string[] {
  const lines: string[] = [];
  const add = (n: number, one: string, many: string) => {
    if (n > 0) lines.push(`${n} ${n === 1 ? one : many}`);
  };
  add(c.sessions, "session", "sessions");
  add(c.reports, "lesson report", "lesson reports");
  add(c.materials, "teaching material", "teaching materials");
  add(c.messages, "report message", "report messages");
  add(c.documents, "uploaded document", "uploaded documents");
  add(
    c.enrollmentsRequested,
    "requested enrollment (and its sessions & reports)",
    "requested enrollments (and their sessions & reports)",
  );
  if (c.enrollmentsAssigned > 0) {
    lines.push(
      `${c.enrollmentsAssigned} enrollment${c.enrollmentsAssigned === 1 ? "" : "s"} will be unassigned`,
    );
  }
  return lines;
}
