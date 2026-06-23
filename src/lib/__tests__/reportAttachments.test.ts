import { describe, it, expect } from "vitest";
import {
  renderLessonReportEmail,
  type LessonReportEmailData,
} from "@/lib/email/templates/lessonReport";
import { materialKindLabel, isHomeworkKind } from "@/lib/uploads/labels";

const baseReport: LessonReportEmailData = {
  parentFirstName: "Ada",
  studentName: "Zoe",
  subjectName: "Maths",
  teacherName: "Mr Bell",
  lessonDate: "2026-06-12",
  lessonFocus: "Fractions",
  lessonHighlights: null,
  understanding: 7,
  confidence: 6,
  participation: 8,
  focus: 7,
  homework: 5,
  nextFocus: null,
  howToHelpAtHome: null,
  recordingUrl: null,
  reportUrl: "https://example.test/dashboard/sessions?report=r1",
};

describe("materialKindLabel", () => {
  it("maps homework + lesson_material to friendly labels", () => {
    expect(materialKindLabel("homework")).toBe("Homework");
    expect(materialKindLabel("lesson_material")).toBe("Resource");
    expect(materialKindLabel("other")).toBe("File");
    expect(materialKindLabel("unknown_kind")).toBe("File");
  });

  it("isHomeworkKind only true for homework", () => {
    expect(isHomeworkKind("homework")).toBe(true);
    expect(isHomeworkKind("lesson_material")).toBe(false);
  });
});

describe("renderLessonReportEmail — attachments block", () => {
  it("omits the homework block when there are no attachments", () => {
    const { html, text } = renderLessonReportEmail(baseReport);
    expect(html).not.toContain("Homework &amp; resources");
    expect(text).not.toContain("Homework & resources");
  });

  it("renders each attachment with its label and a download link", () => {
    const { html, text } = renderLessonReportEmail({
      ...baseReport,
      attachments: [
        {
          filename: "week-7-workbook.pdf",
          kindLabel: "Homework",
          url: "https://example.test/api/teacher-materials/m1/download?disposition=attachment",
          isHomework: true,
        },
        {
          filename: "formula-sheet.pdf",
          kindLabel: "Resource",
          url: "https://example.test/api/teacher-materials/m2/download?disposition=attachment",
          isHomework: false,
        },
      ],
    });

    expect(html).toContain("Homework &amp; resources");
    expect(html).toContain("week-7-workbook.pdf");
    expect(html).toContain("formula-sheet.pdf");
    expect(html).toContain("/api/teacher-materials/m1/download");
    expect(text).toContain("week-7-workbook.pdf (Homework)");
    expect(text).toContain("formula-sheet.pdf (Resource)");
  });

  it("escapes HTML in attachment filenames", () => {
    const { html } = renderLessonReportEmail({
      ...baseReport,
      attachments: [
        {
          filename: "<script>alert(1)</script>.pdf",
          kindLabel: "Homework",
          url: "https://example.test/api/teacher-materials/m3/download",
          isHomework: true,
        },
      ],
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
