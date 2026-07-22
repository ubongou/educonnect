import { describe, it, expect } from "vitest";
import { parseReportAttachmentLink } from "@/lib/uploads/links";

const studentId = "11111111-1111-4111-8111-111111111111";

describe("parseReportAttachmentLink", () => {
  it("accepts a full https URL and derives a tidy label", () => {
    const res = parseReportAttachmentLink({
      studentId,
      kind: "homework",
      url: "https://www.quizizz.com/join/abc123/",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.url).toBe("https://www.quizizz.com/join/abc123/");
    // www. stripped, trailing slash trimmed for the label
    expect(res.data.label).toBe("quizizz.com/join/abc123");
    expect(res.data.kind).toBe("homework");
  });

  it("prepends https:// when the scheme is missing", () => {
    const res = parseReportAttachmentLink({
      studentId,
      kind: "lesson_material",
      url: "quizizz.com/join/abc123",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.url).toBe("https://quizizz.com/join/abc123");
  });

  it("prefers a teacher-supplied title as the label", () => {
    const res = parseReportAttachmentLink({
      studentId,
      kind: "homework",
      url: "https://forms.gle/xyz",
      title: "  Fractions quiz  ",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.label).toBe("Fractions quiz");
  });

  it("rejects a non-web scheme", () => {
    const res = parseReportAttachmentLink({
      studentId,
      kind: "homework",
      url: "javascript:alert(1)",
    });
    expect(res.ok).toBe(false);
  });

  it("rejects an empty url", () => {
    const res = parseReportAttachmentLink({
      studentId,
      kind: "homework",
      url: "   ",
    });
    expect(res.ok).toBe(false);
  });

  it("rejects an invalid kind", () => {
    const res = parseReportAttachmentLink({
      studentId,
      kind: "demo_video",
      url: "https://quizizz.com",
    });
    expect(res.ok).toBe(false);
  });

  it("rejects a bad student id", () => {
    const res = parseReportAttachmentLink({
      studentId: "not-a-uuid",
      kind: "homework",
      url: "https://quizizz.com",
    });
    expect(res.ok).toBe(false);
  });
});
