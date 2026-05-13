"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelStudentDocumentUpload,
  confirmStudentDocumentUpload,
  deleteStudentDocument,
  requestStudentDocumentUpload,
} from "@/lib/actions/documents";
import {
  studentDocumentPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { isViewableMime } from "@/lib/uploads/viewable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { inputBase } from "@/components/ui/FormField";

export type UploadedDocument = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
  subjectName: string | null;
};

export type EnrollmentOption = {
  id: string;
  subjectName: string;
  teacherName: string | null;
};

const kindLabels: Record<string, string> = {
  test_paper: "Test paper",
  school_report: "School report",
  exam_result: "Exam result",
  other: "Other",
};

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp,video/mp4";
const HINT = "Up to 200 MB · PDFs, JPG, PNG, WEBP, MP4";

type UploadState =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "uploading"; progress: number; documentId: string }
  | { kind: "confirming"; documentId: string }
  | { kind: "error"; message: string };

function humanSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * XHR-based PUT so we get real upload progress events. `fetch` doesn't
 * support upload progress without ReadableStream upload support, which
 * is spotty across mobile browsers.
 *
 * R2 enforces strict Content-Type equality with the value the URL was
 * presigned with — `file.type` is what we passed to presignPut, so we
 * MUST pass the same value here.
 */
async function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true });
      else
        resolve({
          ok: false,
          error: `Upload failed with status ${xhr.status}`,
        });
    };
    xhr.onerror = () =>
      resolve({ ok: false, error: "Network error during upload" });
    xhr.onabort = () => resolve({ ok: false, error: "Upload aborted" });
    xhr.send(file);
  });
}

export function DocumentUpload({
  studentId,
  documents,
  enrollments,
}: {
  studentId: string;
  documents: UploadedDocument[];
  enrollments: EnrollmentOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<keyof typeof kindLabels>("test_paper");
  const [enrollmentId, setEnrollmentId] = useState<string>(
    enrollments[0]?.id ?? "",
  );
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [success, setSuccess] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const isBusy =
    state.kind === "requesting" ||
    state.kind === "uploading" ||
    state.kind === "confirming";

  const doUpload = async (file: File) => {
    setSuccess(null);
    setState({ kind: "idle" });

    if (!enrollmentId) {
      setState({
        kind: "error",
        message: "Approve a subject enrollment for this child before uploading.",
      });
      return;
    }

    // Pre-flight check — server is still authoritative, but reject
    // obviously-bad files in the browser to skip a round-trip.
    const local = validateUpload(studentDocumentPolicy, {
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!local.ok) {
      setState({ kind: "error", message: local.error });
      return;
    }

    setState({ kind: "requesting" });
    const req = await requestStudentDocumentUpload({
      studentId,
      enrollmentId,
      kind,
      mimeType: file.type,
      sizeBytes: file.size,
      originalFilename: file.name,
    });
    if (!req.ok) {
      setState({ kind: "error", message: req.error });
      return;
    }

    setState({ kind: "uploading", progress: 0, documentId: req.documentId });
    const put = await putWithProgress(req.presignedPutUrl, file, (pct) =>
      setState({ kind: "uploading", progress: pct, documentId: req.documentId }),
    );
    if (!put.ok) {
      await cancelStudentDocumentUpload(req.documentId);
      setState({ kind: "error", message: put.error });
      return;
    }

    setState({ kind: "confirming", documentId: req.documentId });
    const conf = await confirmStudentDocumentUpload(req.documentId);
    if (!conf.ok) {
      await cancelStudentDocumentUpload(req.documentId);
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
    if (isBusy) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void doUpload(f);
  };

  const onDelete = (id: string, name: string) => {
    setSuccess(null);
    setState({ kind: "idle" });
    if (!window.confirm(`Delete ${name}? This can't be undone.`)) return;
    startDeleteTransition(async () => {
      const res = await deleteStudentDocument(id);
      if (res.ok) {
        setSuccess("Document removed.");
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
  else if (state.kind === "uploading")
    statusLine = `Uploading… ${progressPct}%`;
  else if (state.kind === "confirming") statusLine = "Finalizing…";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              Upload a new document
            </p>
            <p className="mt-1 text-[13px] text-g600">
              PDFs, images, scans, or short videos. The assigned teacher will see it immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-[6px]">
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                Subject
              </span>
              <select
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                className={`${inputBase} py-2 text-[13px]`}
                disabled={isBusy || enrollments.length === 0}
              >
                {enrollments.length === 0 ? (
                  <option value="">No approved subjects yet</option>
                ) : (
                  enrollments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.subjectName}
                      {e.teacherName ? ` · ${e.teacherName}` : ""}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                Kind
              </span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as keyof typeof kindLabels)}
                className={`${inputBase} py-2 text-[13px]`}
                disabled={isBusy}
              >
                {Object.entries(kindLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {enrollments.length === 0 && (
          <p className="mb-3 rounded-md border-[1.5px] border-yellow/40 bg-yellow/10 px-3 py-2 text-[13px] font-semibold text-navy">
            Once your child has an approved subject enrollment, you can upload
            documents here.
          </p>
        )}

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-navy/30 bg-g50 px-6 py-10 text-center transition-colors hover:border-navy ${
            isBusy || enrollments.length === 0 ? "pointer-events-none opacity-60" : ""
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
          <p className="text-[11px] text-g600">{HINT}</p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={onFilePicked}
            disabled={isBusy || enrollments.length === 0}
            className="sr-only"
            accept={ACCEPT}
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
            className="mt-3 rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
          >
            {errorMessage}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-3 rounded-md border-[1.5px] border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
          >
            {success}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Uploaded files
        </h2>
        {documents.length === 0 ? (
          <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-6 text-[14px] text-g600">
            Nothing uploaded yet for this child.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-[1.5px] border-navy/10 bg-white px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge tone="gray">
                    {kindLabels[d.kind] ?? d.kind}
                  </StatusBadge>
                  {d.subjectName && (
                    <StatusBadge tone="blue">{d.subjectName}</StatusBadge>
                  )}
                  <div>
                    <p className="font-heading text-[14px] font-extrabold text-navy">
                      {d.original_filename}
                    </p>
                    <p className="mt-1 text-[12px] text-g400">
                      Uploaded{" "}
                      {new Date(d.uploaded_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {humanSize(d.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isViewableMime(d.mime_type) && (
                    <a
                      href={`/api/student-documents/${d.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                  <a
                    href={`/api/student-documents/${d.id}/download?disposition=attachment`}
                    className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    disabled={isBusy || deletePending}
                    onClick={() => onDelete(d.id, d.original_filename)}
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
