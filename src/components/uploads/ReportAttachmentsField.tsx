"use client";

import { useRef, useState } from "react";
import {
  addReportAttachmentLink,
  cancelReportAttachmentUpload,
  confirmReportAttachmentUpload,
  deleteStagedReportAttachment,
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
type Mode = "file" | "link";

type StagedAttachment = {
  id: string;
  filename: string;
  kind: AttachmentKind;
  isLink: boolean;
};

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "saving" }
  | { kind: "error"; message: string };

/**
 * Inline uploader for lesson-report attachments. A homework/resource can be an
 * uploaded file (staged R2 upload) OR a pasted link (an online quiz — stored as
 * a link-only row). Chosen ids are surfaced via `onChange`; the parent form
 * promotes + links them on send. Used by both the report composer and the
 * already-sent report view.
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
  const [mode, setMode] = useState<Mode>("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [items, setItems] = useState<StagedAttachment[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "uploading" || status.kind === "saving";

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

    sync([...items, { id: req.id, filename: file.name, kind, isLink: false }]);
    setStatus({ kind: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doAddLink = async () => {
    setStatus({ kind: "saving" });
    const res = await addReportAttachmentLink({
      studentId,
      kind,
      url: linkUrl,
      title: linkTitle.trim() || undefined,
    });
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    sync([...items, { id: res.id, filename: res.label, kind, isLink: true }]);
    setLinkUrl("");
    setLinkTitle("");
    setStatus({ kind: "idle" });
  };

  const onRemove = async (item: StagedAttachment) => {
    sync(items.filter((i) => i.id !== item.id));
    // best-effort — staged row deleted
    if (item.isLink) {
      await deleteStagedReportAttachment(item.id);
    } else {
      await cancelReportAttachmentUpload(item.id);
    }
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

        <div className="flex flex-col gap-[6px]">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
            Attach as
          </span>
          <div className="inline-flex rounded-pill border-2 border-navy p-[2px]">
            {(["file", "link"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setStatus({ kind: "idle" });
                }}
                disabled={busy || disabled}
                className={`rounded-pill px-4 py-[6px] font-heading text-[12px] font-bold capitalize transition-colors disabled:opacity-60 ${
                  mode === m ? "bg-navy text-white" : "text-navy hover:bg-paper"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {mode === "file" && (
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border-2 border-navy bg-white px-5 py-[10px] font-heading text-[13px] font-bold text-navy transition-colors hover:bg-paper ${
              busy || disabled ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {status.kind === "uploading"
              ? `Uploading… ${status.progress}%`
              : "+ Add file"}
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
        )}
      </div>

      {mode === "link" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[240px] flex-1 flex-col gap-[6px]">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
              Link
            </span>
            <input
              type="url"
              inputMode="url"
              placeholder="https://quizizz.com/…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={busy || disabled}
              className={`${inputBase} py-2 text-[13px]`}
            />
          </label>
          <label className="flex min-w-[180px] flex-col gap-[6px]">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
              Label (optional)
            </span>
            <input
              type="text"
              placeholder="e.g. Fractions quiz"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              disabled={busy || disabled}
              className={`${inputBase} py-2 text-[13px]`}
            />
          </label>
          <button
            type="button"
            onClick={() => void doAddLink()}
            disabled={busy || disabled || linkUrl.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-white px-5 py-[10px] font-heading text-[13px] font-bold text-navy transition-colors hover:bg-paper disabled:pointer-events-none disabled:opacity-60"
          >
            {status.kind === "saving" ? "Adding…" : "+ Add link"}
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-g600">{describePolicy(teacherMaterialPolicy)}</p>
      )}

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
                {i.isLink && (
                  <span className="inline-block rounded-pill bg-blue/10 px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.06em] text-blue">
                    Link
                  </span>
                )}
                <span className="font-semibold">{i.filename}</span>
              </span>
              <button
                type="button"
                onClick={() => void onRemove(i)}
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
