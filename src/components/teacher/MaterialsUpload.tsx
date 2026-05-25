"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelTeacherMaterialUpload,
  confirmTeacherMaterialUpload,
  deleteTeacherMaterial,
  requestTeacherMaterialUpload,
  type TeacherMaterialKind,
} from "@/lib/actions/teacher-materials";
import {
  teacherMaterialPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import { isViewableMime } from "@/lib/uploads/viewable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { inputBase } from "@/components/ui/FormField";

export type TeacherMaterial = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
};

const kindLabels: Record<TeacherMaterialKind, string> = {
  lesson_material: "Lesson material",
  homework: "Homework",
  demo_video: "Demo video",
  photo: "Photo",
  other: "Other",
};

const ACCEPT = "image/png,image/jpeg,image/webp,video/mp4";
const HINT = "Up to 200 MB · JPG, PNG, WEBP, MP4";

type UploadState =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "uploading"; progress: number; materialId: string }
  | { kind: "confirming"; materialId: string }
  | { kind: "error"; message: string };

function humanSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * XHR-based PUT so we get real upload progress events. R2 enforces strict
 * Content-Type equality with the value the URL was presigned with — we MUST
 * send the same value the server passed to `presignPut`.
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

export function MaterialsUpload({
  studentId,
  materials,
}: {
  studentId: string;
  materials: TeacherMaterial[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<TeacherMaterialKind>("lesson_material");
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

    // Pre-flight check — server is still authoritative, but reject
    // obviously-bad files in the browser to skip a round-trip.
    const local = validateUpload(teacherMaterialPolicy, {
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!local.ok) {
      setState({ kind: "error", message: local.error });
      return;
    }

    setState({ kind: "requesting" });
    const req = await requestTeacherMaterialUpload({
      studentId,
      kind,
      mimeType: file.type,
      sizeBytes: file.size,
      originalFilename: file.name,
    });
    if (!req.ok) {
      setState({ kind: "error", message: req.error });
      return;
    }

    setState({ kind: "uploading", progress: 0, materialId: req.materialId });
    const put = await putWithProgress(req.presignedPutUrl, file, (pct) =>
      setState({
        kind: "uploading",
        progress: pct,
        materialId: req.materialId,
      }),
    );
    if (!put.ok) {
      await cancelTeacherMaterialUpload(req.materialId);
      setState({ kind: "error", message: put.error });
      return;
    }

    setState({ kind: "confirming", materialId: req.materialId });
    const conf = await confirmTeacherMaterialUpload(req.materialId);
    if (!conf.ok) {
      await cancelTeacherMaterialUpload(req.materialId);
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
      const res = await deleteTeacherMaterial(id);
      if (res.ok) {
        setSuccess("Material removed.");
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
      <div className="rounded-lg border border-line bg-white p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              Share a new material
            </p>
            <p className="mt-1 text-[13px] text-g600">
              Lesson notes, homework sheets, demo videos, or photos. The
              parent will see it on their dashboard.
            </p>
          </div>
          <label className="flex flex-col gap-[6px]">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
              Kind
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as TeacherMaterialKind)}
              className={`${inputBase} py-2 text-[13px]`}
              disabled={isBusy}
            >
              {(Object.keys(kindLabels) as TeacherMaterialKind[]).map((k) => (
                <option key={k} value={k}>
                  {kindLabels[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-navy/30 bg-paper px-6 py-10 text-center transition-colors hover:border-navy ${
            isBusy ? "pointer-events-none opacity-60" : ""
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
            disabled={isBusy}
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
          Your shared materials
        </h2>
        {materials.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            Nothing shared yet for this student.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {materials.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge tone="gray">
                    {kindLabels[m.kind as TeacherMaterialKind] ?? m.kind}
                  </StatusBadge>
                  <div>
                    <p className="font-heading text-[14px] font-semibold text-navy">
                      {m.original_filename}
                    </p>
                    <p className="mt-1 text-[12px] text-g400">
                      Uploaded{" "}
                      {new Date(m.uploaded_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {humanSize(m.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isViewableMime(m.mime_type) && (
                    <a
                      href={`/api/teacher-materials/${m.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                  <a
                    href={`/api/teacher-materials/${m.id}/download?disposition=attachment`}
                    className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    disabled={isBusy || deletePending}
                    onClick={() => onDelete(m.id, m.original_filename)}
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
