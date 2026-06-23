"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelHomeworkSubmission,
  confirmHomeworkSubmission,
  requestHomeworkSubmission,
} from "@/lib/actions/homework";
import {
  acceptAttr,
  studentDocumentPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { putWithProgress } from "@/components/uploads/putWithProgress";

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string };

/**
 * Parent control to upload completed homework back against a lesson report.
 * Compact inline button + progress; on success refreshes so the new
 * submission shows as "Submitted".
 */
export function HomeworkSubmit({
  reportId,
  studentId,
}: {
  reportId: string;
  studentId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = status.kind === "uploading";

  const doUpload = async (file: File) => {
    setStatus({ kind: "idle" });
    const local = validateUpload(studentDocumentPolicy, {
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!local.ok) {
      setStatus({ kind: "error", message: local.error });
      return;
    }

    setStatus({ kind: "uploading", progress: 0 });
    const req = await requestHomeworkSubmission({
      reportId,
      studentId,
      mimeType: file.type,
      sizeBytes: file.size,
      originalFilename: file.name,
    });
    if (!req.ok) {
      setStatus({ kind: "error", message: req.error });
      return;
    }

    const put = await putWithProgress(req.presignedPutUrl, file, (pct) =>
      setStatus({ kind: "uploading", progress: pct }),
    );
    if (!put.ok) {
      await cancelHomeworkSubmission(req.id);
      setStatus({ kind: "error", message: put.error });
      return;
    }

    const conf = await confirmHomeworkSubmission(req.id);
    if (!conf.ok) {
      await cancelHomeworkSubmission(req.id);
      setStatus({ kind: "error", message: conf.error });
      return;
    }

    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border-2 border-navy bg-yellow px-4 py-[8px] font-heading text-[12px] font-bold text-navy transition-colors hover:bg-white ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {busy ? `Uploading… ${status.progress}%` : "Submit completed work"}
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr(studentDocumentPolicy)}
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doUpload(f);
          }}
          className="sr-only"
        />
      </label>
      {status.kind === "error" && (
        <p role="alert" className="text-[12px] font-semibold text-coral">
          {status.message}
        </p>
      )}
    </div>
  );
}
