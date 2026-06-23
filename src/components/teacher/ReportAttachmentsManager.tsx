"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReportAttachmentsField } from "@/components/uploads/ReportAttachmentsField";
import { addMaterialsToReport } from "@/lib/actions/reports";

/**
 * Teacher control on an already-sent report: stage extra homework/resources,
 * then attach them to the report. "Notify parent" sends a short "extra
 * homework added" email rather than re-sending the whole report.
 */
export function ReportAttachmentsManager({
  reportId,
  studentId,
}: {
  reportId: string;
  studentId: string;
}) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [notify, setNotify] = useState(true);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onAttach = () => {
    setMessage(null);
    setError(null);
    if (ids.length === 0) {
      setError("Add at least one file first.");
      return;
    }
    start(async () => {
      const res = await addMaterialsToReport(reportId, ids, notify);
      if (res.ok) {
        setMessage(
          notify ? "Attached and parent notified." : "Attached to the report.",
        );
        setIds([]);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section className="rounded-[28px] border border-line bg-white p-6">
      <h3 className="mb-1 font-heading text-[14px] font-semibold text-navy">
        Add homework or a resource
      </h3>
      <p className="mb-4 text-[12px] text-g400">
        Forgot to attach something? Add it to this report. Choose whether to let
        the parent know.
      </p>

      {/* `key` resets the field after a successful attach. */}
      <ReportAttachmentsField
        key={ids.length === 0 ? message ?? "field" : "field"}
        studentId={studentId}
        onChange={setIds}
        disabled={pending}
      />

      <label className="mt-4 flex items-center gap-2 text-[13px] text-navy">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          disabled={pending}
        />
        Notify parent by email
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onAttach}
          disabled={pending || ids.length === 0}
          className="inline-flex items-center rounded-pill border-2 border-navy bg-coral px-6 py-[10px] font-heading text-[13px] font-bold text-white transition-colors hover:bg-navy disabled:opacity-50"
        >
          {pending ? "Attaching…" : "Attach to report"}
        </button>
        {message && (
          <span role="status" className="text-[13px] font-semibold text-blue">
            {message}
          </span>
        )}
        {error && (
          <span role="alert" className="text-[13px] font-semibold text-coral">
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
