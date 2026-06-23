/**
 * Shared, human-readable labels for teacher-material kinds. In the report-
 * attachment world we surface two: "Homework" (action needed) and "Resource"
 * (FYI, mapped from `lesson_material`). The other historical kinds keep their
 * own labels for the standalone Materials tab.
 */
const TEACHER_MATERIAL_LABELS: Record<string, string> = {
  homework: "Homework",
  lesson_material: "Resource",
  demo_video: "Demo video",
  photo: "Photo",
  other: "File",
};

export function materialKindLabel(kind: string): string {
  return TEACHER_MATERIAL_LABELS[kind] ?? "File";
}

export function isHomeworkKind(kind: string): boolean {
  return kind === "homework";
}
