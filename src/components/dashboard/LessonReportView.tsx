import type { ReactNode } from "react";
import { BatteryBars } from "@/components/ui/BatteryBars";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDuration } from "@/lib/format";
import { confidenceBadge, understandingBadge } from "@/lib/scales";
import { isViewableMime } from "@/lib/uploads/viewable";
import {
  REFERRAL_OFFER,
  whatsappDisplayNumber,
  whatsappReferralUrl,
} from "@/lib/payments/referral";
import { materialKindLabel } from "@/lib/uploads/labels";
import { HomeworkSubmit } from "@/components/dashboard/HomeworkSubmit";
import { RemoveReportFileButton } from "@/components/dashboard/RemoveReportFileButton";
import { ReviewButton } from "@/components/teacher/ReviewButton";

export type ReportAttachmentItem = {
  id: string;
  kind: string;
  original_filename: string;
  mime_type: string | null;
  /** Set when the attachment is a pasted link (online quiz) rather than a file. */
  link_url: string | null;
};

export type HomeworkSubmissionItem = {
  id: string;
  original_filename: string | null;
  mime_type: string | null;
  /** Set when the parent typed a written answer instead of uploading a file. */
  submission_text: string | null;
  reviewed_at: string | null;
};

export type LessonReportViewData = {
  id: string;
  lesson_date: string;
  duration_minutes: number;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  lesson_highlights: string | null;
  participation: number;
  focus_rating: number;
  homework: number;
  next_focus: string | null;
  how_to_help_at_home: string | null;
  recording_url: string | null;
  subject_name: string;
  teacher_name: string | null;
  skill_ratings: Array<{ name: string; rating: number }>;
};

export function LessonReportView({
  report,
  attachments = [],
  submissions = [],
  submitContext = null,
  reviewable = false,
  canManageAttachments = false,
  thread = null,
  showReferralOffer = false,
}: {
  report: LessonReportViewData;
  /** Files the teacher attached (homework workbooks, resources). */
  attachments?: ReportAttachmentItem[];
  /** Completed-homework files the parent has submitted back. */
  submissions?: HomeworkSubmissionItem[];
  /** When set (parent view), renders the "Submit completed work" control. */
  submitContext?: { studentId: string } | null;
  /** When true (teacher view), shows a "Mark reviewed" toggle per submission. */
  reviewable?: boolean;
  /**
   * When true (teacher/admin view), shows a "Remove" control per attachment —
   * the fix for attaching the wrong file to an already-sent report.
   */
  canManageAttachments?: boolean;
  /** Optional message thread, rendered directly under the key metrics. */
  thread?: ReactNode;
  /**
   * Parent view only. This component is shared with the teacher and admin
   * portals, and a referral offer aimed at parents has no business appearing
   * there — hence an explicit flag rather than inferring it from another prop.
   */
  showReferralOffer?: boolean;
}) {
  const u = understandingBadge(report.understanding_check);
  const c = confidenceBadge(report.confidence_level);
  const hasHomework = attachments.some((a) => a.kind === "homework");

  return (
    <article className="flex w-full min-w-0 flex-col gap-6">
      {/* Session summary header */}
      <div className="rounded-lg bg-navy p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-heading text-[14px] font-semibold text-yellow">
            {formatDate(report.lesson_date)}
          </span>
          <span className="text-[12px] text-white/60">
            {report.subject_name}
            {report.teacher_name && ` · ${report.teacher_name}`}
            {` · ${formatDuration(report.duration_minutes)}`}
          </span>
        </div>
        <h2 className="mt-2 font-heading text-[22px] font-semibold">
          {report.lesson_focus}
        </h2>
        {report.recording_url && (
          <a
            href={report.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-blue px-5 py-[9px] font-heading text-[13px] font-bold text-navy transition-colors hover:bg-yellow"
          >
            <span aria-hidden="true">▶</span>
            Watch class recording
          </a>
        )}
      </div>

      {/* Lesson highlights — surfaced above metrics per client feedback */}
      {report.lesson_highlights && (
        <div className="rounded-[28px] border border-line bg-white p-6">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Lesson highlights
          </p>
          <p className="mt-2 text-[14px] italic leading-[1.65] text-navy">
            &ldquo;{report.lesson_highlights}&rdquo;
          </p>
        </div>
      )}

      {/* Next focus + help at home — surfaced above metrics per client feedback */}
      {(report.next_focus || report.how_to_help_at_home) && (
        <div className="grid gap-5 rounded-[28px] border border-line bg-white p-6 md:grid-cols-2">
          {report.next_focus && (
            <div>
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                Next focus
              </p>
              <p className="mt-2 text-[14px] text-navy">{report.next_focus}</p>
            </div>
          )}
          {report.how_to_help_at_home && (
            <div>
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                Help at home
              </p>
              <p className="mt-2 text-[14px] text-navy">
                {report.how_to_help_at_home}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Homework & resources */}
      {(attachments.length > 0 || submissions.length > 0) && (
        <div className="rounded-[28px] border border-line bg-white p-6">
          <h3 className="mb-4 font-heading text-[14px] font-semibold text-navy">
            Homework &amp; resources
          </h3>
          {attachments.length > 0 && (
            <ul className="flex flex-col gap-2">
              {attachments.map((a) => {
                const isHomework = a.kind === "homework";
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge tone={isHomework ? "amber" : "gray"}>
                        {isHomework ? "Homework" : materialKindLabel(a.kind)}
                      </StatusBadge>
                      <span className="font-heading text-[14px] font-semibold text-navy">
                        {a.original_filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.link_url ? (
                        <a
                          href={a.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                        >
                          Open link
                        </a>
                      ) : (
                        <>
                          {isViewableMime(a.mime_type) && (
                            <a
                              href={`/api/teacher-materials/${a.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                            >
                              View
                            </a>
                          )}
                          <a
                            href={`/api/teacher-materials/${a.id}/download?disposition=attachment`}
                            className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                          >
                            Download
                          </a>
                        </>
                      )}
                      {canManageAttachments && (
                        <RemoveReportFileButton
                          id={a.id}
                          target="attachment"
                          label={a.original_filename}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Completed work — parent submits, both sides see status */}
          {(hasHomework || submissions.length > 0) && (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-paper p-4">
              <p className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                Completed work
              </p>
              {submissions.length > 0 ? (
                <ul className="mb-3 flex flex-col gap-2">
                  {submissions.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <StatusBadge tone={s.reviewed_at ? "green" : "blue"}>
                          {s.reviewed_at ? "Reviewed" : "Submitted"}
                        </StatusBadge>
                        {s.submission_text ? (
                          <p className="whitespace-pre-wrap font-heading text-[13px] font-semibold text-navy">
                            {s.submission_text}
                          </p>
                        ) : (
                          <a
                            href={`/api/student-documents/${s.id}/download?disposition=attachment`}
                            className="font-heading text-[13px] font-semibold text-navy underline-offset-4 hover:underline"
                          >
                            {s.original_filename}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {reviewable && (
                          <ReviewButton
                            documentId={s.id}
                            reviewed={Boolean(s.reviewed_at)}
                          />
                        )}
                        {/* Parents can retract their own work until it's reviewed. */}
                        {submitContext && !s.reviewed_at && (
                          <RemoveReportFileButton
                            id={s.id}
                            target="submission"
                            label={
                              s.original_filename ??
                              s.submission_text?.slice(0, 60) ??
                              "your answer"
                            }
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-3 text-[13px] text-g600">
                  Nothing submitted yet.
                </p>
              )}
              {submitContext && hasHomework && (
                <HomeworkSubmit
                  reportId={report.id}
                  studentId={submitContext.studentId}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid gap-5 rounded-[28px] border border-line bg-white p-6 md:grid-cols-2">
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Understanding
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-heading text-[22px] font-semibold tabular-nums text-navy">
              {report.understanding_check}
              <span className="text-[14px] text-g400"> / 10</span>
            </span>
            <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
          </div>
        </div>
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Confidence
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-heading text-[22px] font-semibold tabular-nums text-navy">
              {report.confidence_level}
              <span className="text-[14px] text-g400"> / 10</span>
            </span>
            <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
          </div>
        </div>
      </div>

      {/* Message thread — sits directly under Understanding / Confidence */}
      {thread}

      {/* Behaviours */}
      <div className="rounded-[28px] border border-line bg-white p-6">
        <h3 className="mb-4 font-heading text-[14px] font-semibold text-navy">
          Learning behaviours
        </h3>
        <div className="flex flex-col gap-3">
          <BatteryBars
            label="Participation"
            value={report.participation}
            max={10}
            readOnly
          />
          <BatteryBars
            label="Focus and attention"
            value={report.focus_rating}
            max={10}
            readOnly
          />
          <BatteryBars
            label="Homework completion"
            value={report.homework}
            max={10}
            readOnly
          />
        </div>
      </div>

      {/* Skill tracker (optional) */}
      {report.skill_ratings.length > 0 && (
        <div className="rounded-[28px] border border-line bg-white p-6">
          <h3 className="mb-4 font-heading text-[14px] font-semibold text-navy">
            Skill tracker — {report.subject_name}
          </h3>
          <div className="flex flex-col gap-3">
            {report.skill_ratings.map((s) => (
              <BatteryBars
                key={s.name}
                label={s.name}
                value={s.rating}
                max={10}
                readOnly
              />
            ))}
          </div>
        </div>
      )}

      {showReferralOffer && (
        <div className="rounded-[28px] bg-yellow p-8 text-center">
          <h3 className="font-heading text-[22px] font-semibold leading-tight text-navy">
            {REFERRAL_OFFER.headline}
          </h3>
          <p className="mx-auto mt-2 max-w-[46ch] text-[14px] leading-[1.55] text-navy/80">
            {REFERRAL_OFFER.body}
          </p>
          <a
            href={whatsappReferralUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-[#25D366] px-7 py-3 font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.03 0 1.2.87 2.35.99 2.51.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29z" />
            </svg>
            {REFERRAL_OFFER.cta}
          </a>
          <p className="mt-3 text-[12px] text-navy/70">
            {REFERRAL_OFFER.fallback}{" "}
            <span className="font-semibold tabular-nums">
              {whatsappDisplayNumber()}
            </span>
          </p>
        </div>
      )}
    </article>
  );
}
