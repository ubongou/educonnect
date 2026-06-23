import { describe, it, expect } from "vitest";
import {
  acceptAttr,
  describePolicy,
  intakeUploadPolicy,
  studentDocumentPolicy,
  teacherMaterialPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { studentDocumentUploadSchema } from "@/lib/validation";

const MB = 1024 * 1024;

describe("validateUpload — intakeUploadPolicy", () => {
  it("accepts a 5MB JPG", () => {
    expect(
      validateUpload(intakeUploadPolicy, {
        mimeType: "image/jpeg",
        sizeBytes: 5 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("accepts a PDF at the 20MB limit", () => {
    expect(
      validateUpload(intakeUploadPolicy, {
        mimeType: "application/pdf",
        sizeBytes: 20 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("accepts .doc (application/msword)", () => {
    expect(
      validateUpload(intakeUploadPolicy, {
        mimeType: "application/msword",
        sizeBytes: 1 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("accepts .docx", () => {
    expect(
      validateUpload(intakeUploadPolicy, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 1 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects a 25MB PDF as oversized", () => {
    const result = validateUpload(intakeUploadPolicy, {
      mimeType: "application/pdf",
      sizeBytes: 25 * MB,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/20 MB/);
    }
  });

  it("rejects a disallowed MIME type (application/x-msdownload)", () => {
    const result = validateUpload(intakeUploadPolicy, {
      mimeType: "application/x-msdownload",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not allowed/);
    }
  });

  it("rejects empty files (sizeBytes=0)", () => {
    const result = validateUpload(intakeUploadPolicy, {
      mimeType: "application/pdf",
      sizeBytes: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/empty/i);
    }
  });

  it("rejects negative sizeBytes as empty", () => {
    const result = validateUpload(intakeUploadPolicy, {
      mimeType: "application/pdf",
      sizeBytes: -1,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects mp4 — intake does NOT allow video", () => {
    const result = validateUpload(intakeUploadPolicy, {
      mimeType: "video/mp4",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
  });

  it("formats unknown MIME gracefully when input is empty", () => {
    const result = validateUpload(intakeUploadPolicy, {
      mimeType: "",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unknown/);
    }
  });
});

describe("validateUpload — studentDocumentPolicy", () => {
  it("accepts a 5MB JPG", () => {
    expect(
      validateUpload(studentDocumentPolicy, {
        mimeType: "image/jpeg",
        sizeBytes: 5 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("accepts mp4 video", () => {
    expect(
      validateUpload(studentDocumentPolicy, {
        mimeType: "video/mp4",
        sizeBytes: 50 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects 250MB JPG as oversized (limit is 200MB)", () => {
    const result = validateUpload(studentDocumentPolicy, {
      mimeType: "image/jpeg",
      sizeBytes: 250 * MB,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/200 MB/);
    }
  });

  it("rejects empty files", () => {
    const result = validateUpload(studentDocumentPolicy, {
      mimeType: "image/jpeg",
      sizeBytes: 0,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects application/x-msdownload", () => {
    const result = validateUpload(studentDocumentPolicy, {
      mimeType: "application/x-msdownload",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects .doc — student docs do NOT allow Word files", () => {
    const result = validateUpload(studentDocumentPolicy, {
      mimeType: "application/msword",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects .docx — student docs do NOT allow Word files", () => {
    const result = validateUpload(studentDocumentPolicy, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateUpload — teacherMaterialPolicy", () => {
  it("accepts a PNG image", () => {
    expect(
      validateUpload(teacherMaterialPolicy, {
        mimeType: "image/png",
        sizeBytes: 2 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("accepts mp4 video", () => {
    expect(
      validateUpload(teacherMaterialPolicy, {
        mimeType: "video/mp4",
        sizeBytes: 100 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("accepts PDF — teachers can share PDFs with parents", () => {
    expect(
      validateUpload(teacherMaterialPolicy, {
        mimeType: "application/pdf",
        sizeBytes: 1 * MB,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects .doc — teacher materials do NOT allow Word files", () => {
    const result = validateUpload(teacherMaterialPolicy, {
      mimeType: "application/msword",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects .docx — teacher materials do NOT allow Word files", () => {
    const result = validateUpload(teacherMaterialPolicy, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 1 * MB,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects 250MB mp4 as oversized", () => {
    const result = validateUpload(teacherMaterialPolicy, {
      mimeType: "video/mp4",
      sizeBytes: 250 * MB,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/200 MB/);
    }
  });

  it("rejects empty files", () => {
    const result = validateUpload(teacherMaterialPolicy, {
      mimeType: "video/mp4",
      sizeBytes: 0,
    });
    expect(result.ok).toBe(false);
  });
});

describe("policy prefixes", () => {
  it("each policy has a distinct, no-trailing-slash prefix", () => {
    expect(intakeUploadPolicy.prefix).toBe("intake-files");
    expect(studentDocumentPolicy.prefix).toBe("student-documents");
    expect(teacherMaterialPolicy.prefix).toBe("teacher-materials");
    for (const policy of [
      intakeUploadPolicy,
      studentDocumentPolicy,
      teacherMaterialPolicy,
    ]) {
      expect(policy.prefix.endsWith("/")).toBe(false);
    }
  });
});

describe("acceptAttr / describePolicy — derived from the policy", () => {
  it("acceptAttr lists every allowed MIME type", () => {
    const accept = acceptAttr(teacherMaterialPolicy);
    expect(accept).toContain("application/pdf");
    expect(accept).toContain("video/mp4");
    // Every entry in the allowlist appears in the accept string.
    for (const mime of teacherMaterialPolicy.allowedMime) {
      expect(accept).toContain(mime);
    }
  });

  it("accept string never drifts from the policy (regression guard)", () => {
    // The PDF bug was a hardcoded accept attr disagreeing with the policy.
    // Deriving it means the two are the same source of truth.
    const accept = acceptAttr(teacherMaterialPolicy);
    const fromPolicy = Array.from(teacherMaterialPolicy.allowedMime).join(",");
    expect(accept).toBe(fromPolicy);
  });

  it("describePolicy mentions the size cap and friendly type labels", () => {
    const hint = describePolicy(teacherMaterialPolicy);
    expect(hint).toMatch(/200 MB/);
    expect(hint).toContain("PDF");
    expect(hint).toContain("MP4");
  });

  it("describePolicy reflects intake's Word-doc support", () => {
    const hint = describePolicy(intakeUploadPolicy);
    expect(hint).toContain("DOC");
    expect(hint).toContain("DOCX");
  });
});

describe("requestStudentDocumentUpload schema", () => {
  it("rejects payloads without enrollmentId", () => {
    const result = studentDocumentUploadSchema.safeParse({
      studentId: "11111111-1111-4111-8111-111111111111",
      kind: "test_paper",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      originalFilename: "x.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID enrollmentId", () => {
    const result = studentDocumentUploadSchema.safeParse({
      studentId: "11111111-1111-4111-8111-111111111111",
      enrollmentId: "not-a-uuid",
      kind: "test_paper",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      originalFilename: "x.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete payload", () => {
    const result = studentDocumentUploadSchema.safeParse({
      studentId: "11111111-1111-4111-8111-111111111111",
      enrollmentId: "22222222-2222-4222-8222-222222222222",
      kind: "test_paper",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      originalFilename: "x.pdf",
    });
    expect(result.success).toBe(true);
  });
});
