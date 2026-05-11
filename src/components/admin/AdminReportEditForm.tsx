"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BatteryBars } from "@/components/ui/BatteryBars";
import { RatingScaleSlider } from "@/components/ui/RatingScaleSlider";
import { FormField, inputBase } from "@/components/ui/FormField";
import { updateLessonReport } from "@/lib/actions/reports";

export type EditableSkill = {
  id: string;
  name: string;
  rating: number;
};

type Props = {
  reportId: string;
  studentName: string;
  subjectName: string;
  initial: {
    lesson_date: string;
    duration_minutes: number;
    lesson_focus: string;
    lesson_highlights: string | null;
    next_focus: string | null;
    how_to_help_at_home: string | null;
    understanding_check: number;
    confidence_level: number;
    participation: number;
    focus_rating: number;
    homework: number;
  };
  skills: EditableSkill[];
};

export function AdminReportEditForm({
  reportId,
  studentName,
  subjectName,
  initial,
  skills,
}: Props) {
  const router = useRouter();

  const [lessonDate, setLessonDate] = useState(initial.lesson_date);
  const [duration, setDuration] = useState(initial.duration_minutes);
  const [lessonFocus, setLessonFocus] = useState(initial.lesson_focus);
  const [highlights, setHighlights] = useState(initial.lesson_highlights ?? "");
  const [nextFocus, setNextFocus] = useState(initial.next_focus ?? "");
  const [helpAtHome, setHelpAtHome] = useState(initial.how_to_help_at_home ?? "");

  const [understanding, setUnderstanding] = useState(initial.understanding_check);
  const [confidence, setConfidence] = useState(initial.confidence_level);

  const [participation, setParticipation] = useState(initial.participation);
  const [focusRating, setFocusRating] = useState(initial.focus_rating);
  const [homework, setHomework] = useState(initial.homework);

  const [skillRatings, setSkillRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(skills.map((s) => [s.id, s.rating])),
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
      skill_ratings: skills.map((s) => ({
        skill_id: s.id,
        rating: skillRatings[s.id] ?? 0,
      })),
    };

    startTransition(async () => {
      const res = await updateLessonReport(reportId, payload);
      if (res.ok) {
        router.push(`/admin/reports/${reportId}?saved=1`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <div className="rounded-lg bg-navy px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-heading text-[14px] font-extrabold text-yellow">
            {studentName}
          </span>
          <span className="text-[12px] text-white/80">{subjectName}</span>
        </div>
        <p className="mt-1 text-[13px] text-white/80">
          Editing this report won&apos;t re-send the parent email.
        </p>
      </div>

      <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
        <h2 className="mb-4 font-heading text-[15px] font-extrabold text-navy">
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
          <FormField label="Next focus">
            <input
              type="text"
              value={nextFocus}
              onChange={(e) => setNextFocus(e.target.value)}
              className={inputBase}
            />
          </FormField>
          <FormField label="How the parent can help at home">
            <input
              type="text"
              value={helpAtHome}
              onChange={(e) => setHelpAtHome(e.target.value)}
              className={inputBase}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
        <h2 className="mb-4 font-heading text-[15px] font-extrabold text-navy">
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

      <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
        <h2 className="mb-4 font-heading text-[15px] font-extrabold text-navy">
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

      {skills.length > 0 && (
        <section className="rounded-lg border-[1.5px] border-navy/10 bg-white p-6">
          <h2 className="mb-1 font-heading text-[15px] font-extrabold text-navy">
            Skill tracker — {subjectName}
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
          className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-4 py-3 text-[14px] font-semibold text-coral"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/admin/reports/${reportId}`)}
          className="rounded-pill border-[1.5px] border-navy bg-white px-6 py-[12px] font-heading text-[14px] font-bold text-navy hover:bg-g50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-8 py-[14px] font-heading text-[15px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
