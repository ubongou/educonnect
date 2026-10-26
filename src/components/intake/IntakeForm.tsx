"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  recordIntakeFile,
  requestIntakeFileUpload,
  submitIntake,
} from "@/lib/actions/onboarding";
import { putWithProgress } from "@/components/uploads/putWithProgress";
import type { IntakeFileKind } from "@/types/domain";

import {
  ChildInfoSection,
  emptyChildInfo,
  type ChildInfoValues,
} from "./sections/ChildInfoSection";
import {
  LearningBackgroundSection,
  emptyLearningBackground,
  type LearningBackgroundValues,
} from "./sections/LearningBackgroundSection";
import {
  StrengthsSection,
  emptyStrengths,
  type StrengthsValues,
} from "./sections/StrengthsSection";
import {
  ChallengesSection,
  emptyChallenges,
  type ChallengesValues,
} from "./sections/ChallengesSection";
import {
  MotivationSection,
  emptyMotivation,
  type MotivationValues,
} from "./sections/MotivationSection";
import {
  BehaviourSection,
  emptyBehaviour,
  type BehaviourValues,
} from "./sections/BehaviourSection";
import {
  PersonalitySection,
  emptyPersonality,
  type PersonalityValues,
} from "./sections/PersonalitySection";
import {
  GoalsSection,
  emptyGoals,
  type GoalsValues,
} from "./sections/GoalsSection";

type IntakeState = {
  childInfo: ChildInfoValues;
  learning_background: LearningBackgroundValues;
  strengths: StrengthsValues;
  challenges: ChallengesValues;
  motivation: MotivationValues;
  behaviour: BehaviourValues;
  personality: PersonalityValues;
  goals: GoalsValues;
};

const empty: IntakeState = {
  childInfo: emptyChildInfo,
  learning_background: emptyLearningBackground,
  strengths: emptyStrengths,
  challenges: emptyChallenges,
  motivation: emptyMotivation,
  behaviour: emptyBehaviour,
  personality: emptyPersonality,
  goals: emptyGoals,
};

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === 0 || v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

const fileLabels: Record<IntakeFileKind, string> = {
  curriculum: "Curriculum document",
  school_report: "School report",
  class_notes: "Class notes",
};

/**
 * Uploads one intake file straight from the browser to storage. Never throws:
 * any failure comes back as a message for the parent.
 */
async function uploadIntakeFile(
  studentId: string,
  kind: IntakeFileKind,
  file: File,
): Promise<string | null> {
  try {
    const details = {
      studentId,
      kind,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      originalFilename: file.name,
    };
    const req = await requestIntakeFileUpload(details);
    if (!req.ok) return req.error;
    const put = await putWithProgress(req.presignedPutUrl, file, () => {});
    if (!put.ok) return put.error;
    const rec = await recordIntakeFile({ ...details, storageKey: req.storageKey });
    return rec.ok ? null : rec.error;
  } catch (err) {
    return err instanceof Error ? err.message : "Upload failed";
  }
}

const stepTitles = [
  "About your child",
  "Learning background",
  "Strengths",
  "Challenges",
  "Motivation",
  "Behaviour",
  "Personality",
  "Goals",
];

function childInfoComplete(v: ChildInfoValues): boolean {
  return (
    v.full_name.trim().length > 0 &&
    v.date_of_birth.trim().length > 0 &&
    v.gender !== "" &&
    v.curriculum !== "" &&
    (v.curriculum !== "other" || v.curriculum_other.trim().length > 0)
  );
}

function StepperNav({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Intake progress, step ${current + 1} of ${total}`}
      className="relative h-[3px] overflow-hidden rounded-pill bg-navy/10"
    >
      <div
        className="absolute inset-y-0 left-0 bg-coral transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function IntakeForm() {
  const [v, setV] = useState<IntakeState>(empty);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Set once the child is registered, so a retry after a failed file upload
  // can never register the same child twice.
  const [studentId, setStudentId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  const patch = <K extends keyof IntakeState>(key: K, next: IntakeState[K]) =>
    setV((prev) => ({ ...prev, [key]: next }));

  const goTo = (i: number) => {
    if (i < 0 || i >= stepTitles.length) return;
    setStep(i);
    setError(null);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Block implicit submissions from earlier steps (e.g. Enter pressed in any
    // text input). The explicit "Submit intake" button only renders on the
    // final step, so a real submit can only originate from there.
    if (!isLast) return;

    setError(null);

    if (studentId) {
      router.push("/dashboard");
      return;
    }

    if (!childInfoComplete(v.childInfo)) {
      goTo(0);
      setError("Fill in the required fields in step 1 before submitting.");
      return;
    }

    startTransition(async () => {
      const childInfo = v.childInfo;
      const payload = {
        childInfo: {
          full_name: childInfo.full_name,
          preferred_name: childInfo.preferred_name || undefined,
          date_of_birth: childInfo.date_of_birth,
          gender: childInfo.gender,
          current_school: childInfo.current_school || undefined,
          curriculum: childInfo.curriculum,
          curriculum_other: childInfo.curriculum_other || undefined,
        },
        learning_background: stripEmpty(v.learning_background),
        strengths: stripEmpty(v.strengths),
        challenges: stripEmpty(v.challenges),
        motivation: stripEmpty(v.motivation),
        behaviour: stripEmpty(v.behaviour),
        personality: stripEmpty(v.personality),
        goals: stripEmpty(v.goals),
      };

      let res: Awaited<ReturnType<typeof submitIntake>>;
      try {
        res = await submitIntake(payload);
      } catch {
        setError(
          "We couldn't reach the server. Check your internet connection and press Submit again.",
        );
        return;
      }
      if (!res.ok) {
        setError(res.error);
        return;
      }

      const failed: string[] = [];
      for (const kind of ["curriculum", "school_report", "class_notes"] as const) {
        const f = childInfo.files[kind];
        if (!f) continue;
        const uploadError = await uploadIntakeFile(res.studentId, kind, f);
        if (uploadError) failed.push(`${fileLabels[kind]}: ${uploadError}`);
      }

      if (failed.length > 0) {
        setStudentId(res.studentId);
        setError(
          `Your child is registered, but some files didn't upload (${failed.join("; ")}). ` +
            "You can send them to us later. Press Go to dashboard to continue.",
        );
        return;
      }

      router.push("/dashboard");
    });
  };

  const isLast = step === stepTitles.length - 1;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div ref={topRef}>
        <StepperNav total={stepTitles.length} current={step} />
      </div>

      {/* Render only the active section so the page stays short. */}
      <div hidden={step !== 0}>
        <ChildInfoSection
          number={1}
          value={v.childInfo}
          onChange={(n) => patch("childInfo", n)}
        />
      </div>
      <div hidden={step !== 1}>
        <LearningBackgroundSection
          number={2}
          value={v.learning_background}
          onChange={(n) => patch("learning_background", n)}
        />
      </div>
      <div hidden={step !== 2}>
        <StrengthsSection
          number={3}
          value={v.strengths}
          onChange={(n) => patch("strengths", n)}
        />
      </div>
      <div hidden={step !== 3}>
        <ChallengesSection
          number={4}
          value={v.challenges}
          onChange={(n) => patch("challenges", n)}
        />
      </div>
      <div hidden={step !== 4}>
        <MotivationSection
          number={5}
          value={v.motivation}
          onChange={(n) => patch("motivation", n)}
        />
      </div>
      <div hidden={step !== 5}>
        <BehaviourSection
          number={6}
          value={v.behaviour}
          onChange={(n) => patch("behaviour", n)}
        />
      </div>
      <div hidden={step !== 6}>
        <PersonalitySection
          number={7}
          value={v.personality}
          onChange={(n) => patch("personality", n)}
        />
      </div>
      <div hidden={step !== 7}>
        <GoalsSection number={8} value={v.goals} onChange={(n) => patch("goals", n)} />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-4 py-3 text-[14px] font-semibold text-coral"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || pending}
          onClick={() => goTo(step - 1)}
        >
          Previous
        </Button>

        <p className="text-[13px] text-g600">
          {isLast
            ? "You can update your answers later from your dashboard."
            : step === 0 && !childInfoComplete(v.childInfo)
              ? "Fill in the required fields to continue."
              : "Progress saves as you go through the steps."}
        </p>

        {isLast ? (
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Submitting…" : studentId ? "Go to dashboard" : "Submit intake"}
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            disabled={(step === 0 && !childInfoComplete(v.childInfo)) || pending}
            onClick={() => goTo(step + 1)}
          >
            Next
          </Button>
        )}
      </div>
    </form>
  );
}
