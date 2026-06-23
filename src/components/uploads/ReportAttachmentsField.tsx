"use client";

import { useRef, useState } from "react";
import {
  cancelReportAttachmentUpload,
  confirmReportAttachmentUpload,
  requestReportAttachmentUpload,
} from "@/lib/actions/teacher-materials";
import {
  acceptAttr,
  describePolicy,
  teacherMaterialPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { putWithProgress } from "./putWithProgress";
import { inputBase } from "@/components/ui/FormField";

type AttachmentKind = "homework" | "lesson_material";

type StagedAttachment = {
  id: string;
  filename: string;
  kind: AttachmentKind;
};

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string };

/**
 * Inline uploader for lesson-report attachments. Files are uploaded as
 * `staged` teacher materials (hidden from the parent) and the chosen ids are
 * surfaced via `onChange`; the parent form promotes + links them on send.
 * Used by both the report composer and the already-sent report view.
 */
export function ReportAttachmentsField({
  studentId,
  onChange,
  disabled,
}: {
  studentId: string;
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<AttachmentKind>("homework");
  const [items, setItems] = useState<StagedAttachment[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "uploading";

  const sync = (next: StagedAttachment[]) => {
    setItems(next);
    onChange(next.map((i) => i.id));
  };

  const doUpload = async (file: File) => {
    setStatus({ kind: "idle" });
    const local = validateUpload(teacherMaterialPolicy, {
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!local.ok) {
      setStatus({ kind: "error", message: local.error });
      return;
    }

    setStatus({ kind: "uploading", progress: 0 });
    const req = await requestReportAttachmentUpload({
      studentId,
      kind,
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
      await cancelReportAttachmentUpload(req.id);
      setStatus({ kind: "error", message: put.error });
      return;
    }

    const conf = await confirmReportAttachmentUpload(req.id);
    if (!conf.ok) {
      await cancelReportAttachmentUpload(req.id);
      setStatus({ kind: "error", message: conf.error });
      return;
    }

    sync([...items, { id: req.id, filename: file.name, kind }]);
    setStatus({ kind: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onRemove = async (id: string) => {
    sync(items.filter((i) => i.id !== id));
    await cancelReportAttachmentUpload(id); // best-effort; staged row deleted
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
            Type
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AttachmentKind)}
            className={`${inputBase} py-2 text-[13px]`}
            disabled={busy || disabled}
          >
            <option value="homework">Homework (to complete)</option>
            <option value="lesson_material">Resource (for reference)</option>
          </select>
        </label>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border-2 border-navy bg-white px-5 py-[10px] font-heading text-[13px] font-bold text-navy transition-colors hover:bg-paper ${
            busy || disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {busy ? `Uploading… ${status.progress}%` : "+ Add file"}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr(teacherMaterialPolicy)}
            disabled={busy || disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doUpload(f);
            }}
            className="sr-only"
          />
        </label>
      </div>
      <p className="text-[11px] text-g600">{describePolicy(teacherMaterialPolicy)}</p>

      {status.kind === "error" && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {status.message}
        </p>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-2"
            >
              <span className="flex items-center gap-2 text-[13px] text-navy">
                <span
                  className={`inline-block rounded-pill px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.06em] ${
                    i.kind === "homework"
                      ? "bg-yellow text-navy"
                      : "bg-g100 text-g600"
                  }`}
                >
                  {i.kind === "homework" ? "Homework" : "Resource"}
                </span>
                <span className="font-semibold">{i.filename}</span>
              </span>
              <button
                type="button"
                onClick={() => void onRemove(i.id)}
                disabled={busy}
                className="font-heading text-[12px] font-semibold text-g600 underline-offset-4 hover:text-coral hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
