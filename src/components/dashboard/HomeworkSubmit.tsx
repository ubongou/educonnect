"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelHomeworkSubmission,
  confirmHomeworkSubmission,
  requestHomeworkSubmission,
  submitHomeworkText,
} from "@/lib/actions/homework";
import {
  acceptAttr,
  studentDocumentPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { putWithProgress } from "@/components/uploads/putWithProgress";
import { inputBase } from "@/components/ui/FormField";

type Mode = "file" | "text";

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "saving" }
  | { kind: "error"; message: string };

/**
 * Parent control to submit completed homework back against a lesson report —
 * either by uploading a file or typing a short written answer. On success
 * refreshes so the new submission shows as "Submitted".
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
  const [mode, setMode] = useState<Mode>("file");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = status.kind === "uploading" || status.kind === "saving";

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

  const doSubmitText = async () => {
    setStatus({ kind: "saving" });
    const res = await submitHomeworkText({ reportId, studentId, text });
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    setText("");
    setStatus({ kind: "idle" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-fit rounded-pill border-2 border-navy p-[2px]">
        {(["file", "text"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setStatus({ kind: "idle" });
            }}
            disabled={busy}
            className={`rounded-pill px-4 py-[5px] font-heading text-[12px] font-bold transition-colors disabled:opacity-60 ${
              mode === m ? "bg-navy text-white" : "text-navy hover:bg-paper"
            }`}
          >
            {m === "file" ? "Upload file" : "Type answer"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <label
          className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-pill border-2 border-navy bg-yellow px-4 py-[8px] font-heading text-[12px] font-bold text-navy transition-colors hover:bg-white ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {status.kind === "uploading"
            ? `Uploading… ${status.progress}%`
            : "Submit completed work"}
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
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            rows={3}
            placeholder={"Type the answers here, e.g.\n1. fish\n2. books"}
            className={`${inputBase} min-h-[76px] resize-y py-2 text-[13px]`}
          />
          <button
            type="button"
            onClick={() => void doSubmitText()}
            disabled={busy || text.trim().length === 0}
            className="inline-flex w-fit items-center gap-2 rounded-pill border-2 border-navy bg-yellow px-4 py-[8px] font-heading text-[12px] font-bold text-navy transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-60"
          >
            {status.kind === "saving" ? "Submitting…" : "Submit answer"}
          </button>
        </div>
      )}

      {status.kind === "error" && (
        <p role="alert" className="text-[12px] font-semibold text-coral">
          {status.message}
        </p>
      )}
    </div>
  );
}
