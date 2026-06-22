"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BatteryBars } from "@/components/ui/BatteryBars";
import { RatingScaleSlider } from "@/components/ui/RatingScaleSlider";
import { FormField, inputBase } from "@/components/ui/FormField";
import { submitLessonReport } from "@/lib/actions/reports";

export type ComposableSession = {
  id: string;
  session_date: string;
  duration_minutes: number;
  student_id: string;
  subject_id: string;
  student_name: string;
  subject_name: string;
};

export type SubjectSkill = {
  id: string;
  name: string;
  sort_order: number;
};

type Props = {
  session: ComposableSession;
  skills: SubjectSkill[];
};

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function LessonReportForm({ session, skills }: Props) {
  const router = useRouter();
  // Default lesson_date to the session's scheduled calendar day, not today,
  // in case the teacher writes up the report the next morning. session_date is
  // already a YYYY-MM-DD string, so it's used directly.
  const [lessonDate, setLessonDate] = useState(session.session_date || todayIso());
  const [duration, setDuration] = useState(session.duration_minutes);
  const [lessonFocus, setLessonFocus] = useState("");
  const [nextFocus, setNextFocus] = useState("");
  const [highlights, setHighlights] = useState("");
  const [helpAtHome, setHelpAtHome] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");

  const [understanding, setUnderstanding] = useState(5);
  const [confidence, setConfidence] = useState(5);

  const [participation, setParticipation] = useState(5);
  const [focusRating, setFocusRating] = useState(5);
  const [homework, setHomework] = useState(5);

  const [skillRatings, setSkillRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(skills.map((s) => [s.id, 0])),
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (lessonFocus.trim().length === 0) {
      setError("Lesson focus is required.");
      return;
    }

    const payload = {
      session_id: session.id,
      student_id: session.student_id,
      subject_id: session.subject_id,
      lesson_date: lessonDate,
      duration_minutes: duration,
      lesson_focus: lessonFocus,
      understanding_check: understanding,
      confidence_level: confidence,
      lesson_highlights: highlights || undefined,
      participation,
      focus_rating: focusRating,
      homework,
      next_focus: nextFocus || undefined,
      how_to_help_at_home: helpAtHome || undefined,
      recording_url: recordingUrl.trim() || undefined,
      skill_ratings: skills.map((s) => ({
        skill_id: s.id,
        rating: skillRatings[s.id] ?? 0,
      })),
    };

    startTransition(async () => {
      const res = await submitLessonReport(payload);
      if (res.ok) {
        router.push("/teacher?submitted=1");
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {/* Session header — dark navy card, matches the inspiration's
          "Apr 17, 2025 · Ms. Ayobola · Session 14" summary banner. */}
      <div className="rounded-lg bg-navy px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-heading text-[14px] font-semibold text-yellow">
            {session.student_name}
          </span>
          <span className="text-[12px] text-white/60">
            {new Date(session.session_date).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-white/60">
          {session.subject_name} · {session.duration_minutes} min scheduled
        </p>
      </div>

      {/* Lesson metadata */}
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="mb-4 font-heading text-[15px] font-semibold text-navy">
          Lesson details
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Lesson date" required>
            <input
              type="date"
              required
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className={inputBase}
            />
          </FormField>
          <FormField label="Actual duration (min)" required>
            <input
              type="number"
              required
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputBase}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Lesson focus" required>
              <input
                type="text"
                required
                value={lessonFocus}
                onChange={(e) => setLessonFocus(e.target.value)}
                placeholder="e.g. Fractions and mixed numbers"
                className={inputBase}
              />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Lesson highlights"
              hint="What was covered, what went well, notable moments."
            >
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className={clsx(inputBase, "min-h-[100px] resize-y")}
              />
            </FormField>
          </div>
          <FormField label="Next focus" hint="What the next session will target.">
            <input
              type="text"
              value={nextFocus}
              onChange={(e) => setNextFocus(e.target.value)}
              placeholder="e.g. Multiplying fractions"
              className={inputBase}
            />
          </FormField>
          <FormField
            label="How the parent can help at home"
            hint="Optional — a single concrete suggestion works best."
          >
            <input
              type="text"
              value={helpAtHome}
              onChange={(e) => setHelpAtHome(e.target.value)}
              placeholder="e.g. 10 minutes of fraction worksheets daily"
              className={inputBase}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField
              label="Class recording link"
              hint="Optional — paste a shareable https link (Zoom, Meet, Loom, unlisted YouTube). Make sure anyone with the link can view it."
            >
              <input
                type="url"
                inputMode="url"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="https://…"
                className={inputBase}
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* Understanding + Confidence — 1..10 with named levels */}
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="mb-4 font-heading text-[15px] font-semibold text-navy">
          Understanding &amp; confidence
        </h2>
        <div className="flex flex-col gap-6">
          <RatingScaleSlider
            axis="understanding"
            label="Understanding check"
            value={understanding}
            onChange={setUnderstanding}
          />
          <RatingScaleSlider
            axis="confidence"
            label="Confidence level"
            value={confidence}
            onChange={setConfidence}
          />
        </div>
      </section>

      {/* Learning behaviours — 0..10 battery bars */}
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="mb-4 font-heading text-[15px] font-semibold text-navy">
          Learning behaviours
        </h2>
        <div className="flex flex-col gap-4">
          <BatteryBars
            label="Participation"
            value={participation}
            max={10}
            onChange={setParticipation}
          />
          <BatteryBars
            label="Focus and attention"
            value={focusRating}
            max={10}
            onChange={setFocusRating}
          />
          <BatteryBars
            label="Homework completion"
            value={homework}
            max={10}
            onChange={setHomework}
          />
        </div>
      </section>

      {/* Skill tracker — per-subject, 0..10 */}
      {skills.length > 0 && (
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="mb-1 font-heading text-[15px] font-semibold text-navy">
            Skill tracker — {session.subject_name}
          </h2>
          <p className="mb-4 text-[12px] text-g400">
            Rate each skill 0–10. Leave at 0 if not covered this session.
          </p>
          <div className="flex flex-col gap-4">
            {skills.map((s) => (
              <BatteryBars
                key={s.id}
                label={s.name}
                value={skillRatings[s.id] ?? 0}
                max={10}
                onChange={(v) =>
                  setSkillRatings((prev) => ({ ...prev, [s.id]: v }))
                }
              />
            ))}
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-[14px] font-semibold text-coral"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-8 py-[14px] font-heading text-[15px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit lesson report"}
        </button>
      </div>
    </form>
  );
}
