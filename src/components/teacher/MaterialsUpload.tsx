"use client";

import { useState } from "react";
import {
  cancelTeacherMaterialUpload,
  confirmTeacherMaterialUpload,
  deleteTeacherMaterial,
  requestTeacherMaterialUpload,
  type TeacherMaterialKind,
} from "@/lib/actions/teacher-materials";
import { teacherMaterialPolicy } from "@/lib/uploads/policies";
import {
  FileUploader,
  type SharedFileItem,
} from "@/components/uploads/FileUploader";
import { inputBase } from "@/components/ui/FormField";

export type TeacherMaterial = SharedFileItem;

const kindLabels: Record<TeacherMaterialKind, string> = {
  lesson_material: "Lesson material",
  homework: "Homework",
  demo_video: "Demo video",
  photo: "Photo",
  other: "Other",
};

export function MaterialsUpload({
  studentId,
  materials,
}: {
  studentId: string;
  materials: TeacherMaterial[];
}) {
  const [kind, setKind] = useState<TeacherMaterialKind>("lesson_material");
  const [note, setNote] = useState("");

  return (
    <FileUploader
      title="Share a new material"
      description="Lesson notes, homework sheets, PDFs, demo videos, or photos. The parent will see it on their dashboard and get an email."
      policy={teacherMaterialPolicy}
      kindLabels={kindLabels}
      downloadBase="/api/teacher-materials"
      items={materials}
      listTitle="Your shared materials"
      emptyText="Nothing shared yet for this student."
      request={requestTeacherMaterialUpload}
      confirm={confirmTeacherMaterialUpload}
      cancel={cancelTeacherMaterialUpload}
      remove={deleteTeacherMaterial}
      buildPayload={() => ({
        ok: true,
        payload: {
          studentId,
          kind,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      })}
      controls={(busy) => (
        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
            Kind
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as TeacherMaterialKind)}
            className={`${inputBase} py-2 text-[13px]`}
            disabled={busy}
          >
            {(Object.keys(kindLabels) as TeacherMaterialKind[]).map((k) => (
              <option key={k} value={k}>
                {kindLabels[k]}
              </option>
            ))}
          </select>
        </label>
      )}
      extraFields={(busy) => (
        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
            Note to parent <span className="text-g400/70">(optional)</span>
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Here's Friday's homework — due before next lesson."
            className={`${inputBase} py-2 text-[13px]`}
          />
        </label>
      )}
    />
  );
}
