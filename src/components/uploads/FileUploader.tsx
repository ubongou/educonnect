"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  acceptAttr,
  describePolicy,
  validateUpload,
  type UploadPolicy,
} from "@/lib/uploads/policies";
import type { RequestUploadResult, SimpleResult } from "@/lib/uploads/core";
import { isViewableMime } from "@/lib/uploads/viewable";
import { humanSize } from "@/lib/uploads/format";
import { putWithProgress } from "./putWithProgress";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type SharedFileItem = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
};

type UploadState =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "uploading"; progress: number }
  | { kind: "confirming" }
  | { kind: "error"; message: string };

export type FileUploaderProps = {
  title: string;
  description: string;
  policy: UploadPolicy;
  /** Maps a row's `kind` to a human label for the list badge. */
  kindLabels: Record<string, string>;
  /** e.g. "/api/teacher-materials" — `/${id}/download` is appended. */
  downloadBase: string;
  items: SharedFileItem[];
  listTitle: string;
  emptyText: string;
  request: (payload: Record<string, unknown>) => Promise<RequestUploadResult>;
  confirm: (id: string) => Promise<SimpleResult>;
  cancel: (id: string) => Promise<SimpleResult>;
  remove: (id: string) => Promise<SimpleResult>;
  /**
   * Builds the per-upload payload (kind, enrollment, note, …) from current
   * form state. Returning `ok:false` aborts with a user-facing message.
   */
  buildPayload: (
    file: File,
  ) => { ok: true; payload: Record<string, unknown> } | { ok: false; error: string };
  /** Header controls (selects). Receives `busy` so they disable mid-upload. */
  controls?: (busy: boolean) => ReactNode;
  /** Extra fields under the header (e.g. a note textarea). */
  extraFields?: (busy: boolean) => ReactNode;
  /** Disable the dropzone (e.g. parent has no approved enrollments yet). */
  uploadDisabled?: boolean;
  disabledNotice?: ReactNode;
  /** Extra per-row badges (e.g. subject). */
  renderBadges?: (item: SharedFileItem) => ReactNode;
};

/**
 * Shared upload widget for the browser-PUT pipelines (parent documents and
 * teacher materials). Owns the dropzone, the three-step request→PUT→confirm
 * state machine, progress UI, and the managed file list with view/download/
 * delete. Pipeline-specific bits (selects, payload, actions) come via props.
 */
export function FileUploader(props: FileUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [success, setSuccess] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const isBusy =
    state.kind === "requesting" ||
    state.kind === "uploading" ||
    state.kind === "confirming";

  const accept = acceptAttr(props.policy);
  const hint = describePolicy(props.policy);

  const doUpload = async (file: File) => {
    setSuccess(null);
    setState({ kind: "idle" });

    const built = props.buildPayload(file);
    if (!built.ok) {
      setState({ kind: "error", message: built.error });
      return;
    }

    // Pre-flight — the server is authoritative, but reject obviously-bad
    // files in the browser to skip a round-trip.
    const local = validateUpload(props.policy, {
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!local.ok) {
      setState({ kind: "error", message: local.error });
      return;
    }

    setState({ kind: "requesting" });
    const req = await props.request({
      ...built.payload,
      mimeType: file.type,
      sizeBytes: file.size,
      originalFilename: file.name,
    });
    if (!req.ok) {
      setState({ kind: "error", message: req.error });
      return;
    }

    setState({ kind: "uploading", progress: 0 });
    const put = await putWithProgress(req.presignedPutUrl, file, (pct) =>
      setState({ kind: "uploading", progress: pct }),
    );
    if (!put.ok) {
      await props.cancel(req.id);
      setState({ kind: "error", message: put.error });
      return;
    }

    setState({ kind: "confirming" });
    const conf = await props.confirm(req.id);
    if (!conf.ok) {
      await props.cancel(req.id);
      setState({ kind: "error", message: conf.error });
      return;
    }

    setSuccess(`${file.name} uploaded.`);
    setState({ kind: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  };

  const onFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) void doUpload(f);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    if (isBusy || props.uploadDisabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void doUpload(f);
  };

  const onDelete = (id: string, name: string) => {
    setSuccess(null);
    setState({ kind: "idle" });
    if (!window.confirm(`Delete ${name}? This can't be undone.`)) return;
    startDeleteTransition(async () => {
      const res = await props.remove(id);
      if (res.ok) {
        setSuccess("Removed.");
        router.refresh();
      } else {
        setState({ kind: "error", message: res.error });
      }
    });
  };

  const errorMessage = state.kind === "error" ? state.message : null;
  const progressPct = state.kind === "uploading" ? state.progress : 0;

  let statusLine: string | null = null;
  if (state.kind === "requesting") statusLine = "Requesting upload URL…";
  else if (state.kind === "uploading") statusLine = `Uploading… ${progressPct}%`;
  else if (state.kind === "confirming") statusLine = "Finalizing…";

  const dropDisabled = isBusy || props.uploadDisabled;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[28px] border border-line bg-white p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              {props.title}
            </p>
            <p className="mt-1 text-[13px] text-g600">{props.description}</p>
          </div>
          {props.controls && (
            <div className="flex flex-wrap items-end gap-3">
              {props.controls(isBusy)}
            </div>
          )}
        </div>

        {props.disabledNotice}

        {props.extraFields && (
          <div className="mb-4">{props.extraFields(isBusy)}</div>
        )}

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-navy/30 bg-paper px-6 py-10 text-center transition-colors hover:border-navy ${
            dropDisabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            className="text-navy/60"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-[13px] font-semibold text-navy">
            Click to upload or drag and drop
          </p>
          <p className="text-[11px] text-g600">{hint}</p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={onFilePicked}
            disabled={dropDisabled}
            className="sr-only"
            accept={accept}
          />
        </label>

        {state.kind === "uploading" && (
          <div
            className="mt-3"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
          >
            <div className="h-2 w-full overflow-hidden rounded-full bg-g100">
              <div
                className="h-full bg-blue transition-[width] duration-150 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {statusLine && (
          <p className="mt-3 text-[13px] text-g600">{statusLine}</p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
          >
            {errorMessage}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-3 rounded-md border border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
          >
            {success}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          {props.listTitle}
        </h2>
        {props.items.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            {props.emptyText}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {props.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge tone="gray">
                    {props.kindLabels[item.kind] ?? item.kind}
                  </StatusBadge>
                  {props.renderBadges?.(item)}
                  <div>
                    <p className="font-heading text-[14px] font-semibold text-navy">
                      {item.original_filename}
                    </p>
                    <p className="mt-1 text-[12px] text-g400">
                      Uploaded{" "}
                      {new Date(item.uploaded_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {humanSize(item.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isViewableMime(item.mime_type) && (
                    <a
                      href={`${props.downloadBase}/${item.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                  <a
                    href={`${props.downloadBase}/${item.id}/download?disposition=attachment`}
                    className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    disabled={isBusy || deletePending}
                    onClick={() => onDelete(item.id, item.original_filename)}
                    className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-coral hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
