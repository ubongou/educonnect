"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadStudentDocument, deleteStudentDocument } from "@/lib/actions/documents";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { inputBase } from "@/components/ui/FormField";

export type UploadedDocument = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
};

const kindLabels: Record<string, string> = {
  test_paper: "Test paper",
  school_report: "School report",
  exam_result: "Exam result",
  other: "Other",
};

function humanSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
  studentId,
  documents,
}: {
  studentId: string;
  documents: UploadedDocument[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<keyof typeof kindLabels>("test_paper");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const doUpload = (file: File) => {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.append("student_id", studentId);
    fd.append("kind", kind);
    fd.append("file", file);

    startTransition(async () => {
      const res = await uploadStudentDocument(fd);
      if (res.ok) {
        setSuccess(`${file.name} uploaded.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  const onDelete = (id: string, name: string) => {
    setError(null);
    if (!window.confirm(`Delete ${name}? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteStudentDocument(id);
      if (res.ok) {
        setSuccess("Document removed.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              Upload a new document
            </p>
            <p className="mt-1 text-[13px] text-g600">
              PDFs, images, or scans. The assigned teacher will see it immediately.
            </p>
          </div>
          <label className="flex flex-col gap-[6px]">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
              Kind
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as keyof typeof kindLabels)}
              className={`${inputBase} py-2 text-[13px]`}
            >
              {Object.entries(kindLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-navy/30 bg-g50 px-6 py-10 text-center transition-colors hover:border-navy"
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
          <p className="text-[11px] text-g600">
            Up to 20 MB · PDFs, JPG, PNG
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={onFilePicked}
            disabled={pending}
            className="sr-only"
            accept=".pdf,image/png,image/jpeg,image/webp"
          />
        </label>

        {pending && (
          <p className="mt-3 text-[13px] text-g600">Uploading…</p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
          >
            {error}
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
                  <a
                    href={`/api/student-documents/${d.id}/download`}
                    className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    disabled={pending}
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
