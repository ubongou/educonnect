"use client";

import { useState } from "react";
import {
  cancelStudentDocumentUpload,
  confirmStudentDocumentUpload,
  deleteStudentDocument,
  requestStudentDocumentUpload,
} from "@/lib/actions/documents";
import { studentDocumentPolicy } from "@/lib/uploads/policies";
import {
  FileUploader,
  type SharedFileItem,
} from "@/components/uploads/FileUploader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { inputBase } from "@/components/ui/FormField";

export type UploadedDocument = SharedFileItem & {
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

export function DocumentUpload({
  studentId,
  documents,
  enrollments,
}: {
  studentId: string;
  documents: UploadedDocument[];
  enrollments: EnrollmentOption[];
}) {
  const [kind, setKind] = useState<keyof typeof kindLabels>("test_paper");
  const [enrollmentId, setEnrollmentId] = useState<string>(
    enrollments[0]?.id ?? "",
  );

  const noEnrollments = enrollments.length === 0;

  return (
    <FileUploader
      title="Upload a new document"
      description="PDFs, images, scans, or short videos. The assigned teacher will see it immediately."
      policy={studentDocumentPolicy}
      kindLabels={kindLabels}
      downloadBase="/api/student-documents"
      items={documents}
      listTitle="Uploaded files"
      emptyText="Nothing uploaded yet for this child."
      request={requestStudentDocumentUpload}
      confirm={confirmStudentDocumentUpload}
      cancel={cancelStudentDocumentUpload}
      remove={deleteStudentDocument}
      uploadDisabled={noEnrollments}
      buildPayload={() => {
        if (!enrollmentId) {
          return {
            ok: false,
            error:
              "Approve a subject enrollment for this child before uploading.",
          };
        }
        return { ok: true, payload: { studentId, enrollmentId, kind } };
      }}
      controls={(busy) => (
        <>
          <label className="flex flex-col gap-[6px]">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
              Subject
            </span>
            <select
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              className={`${inputBase} py-2 text-[13px]`}
              disabled={busy || noEnrollments}
            >
              {noEnrollments ? (
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
              disabled={busy}
            >
              {Object.entries(kindLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      disabledNotice={
        noEnrollments ? (
          <p className="mb-3 rounded-md border border-yellow/40 bg-yellow/10 px-3 py-2 text-[13px] font-semibold text-navy">
            Once your child has an approved subject enrollment, you can upload
            documents here.
          </p>
        ) : null
      }
      renderBadges={(item) => {
        const subjectName = (item as UploadedDocument).subjectName;
        return subjectName ? (
          <StatusBadge tone="blue">{subjectName}</StatusBadge>
        ) : null;
      }}
    />
  );
}
