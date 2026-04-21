"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { submitIntake } from "@/lib/actions/onboarding";

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

export function IntakeForm() {
  const [v, setV] = useState<IntakeState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const patch = <K extends keyof IntakeState>(key: K, next: IntakeState[K]) =>
    setV((prev) => ({ ...prev, [key]: next }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const fd = new FormData();

      const childInfo = v.childInfo;
      const payload = {
        childInfo: {
          full_name: childInfo.full_name,
          preferred_name: childInfo.preferred_name || undefined,
          age: childInfo.age,
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

      fd.append("payload", JSON.stringify(payload));

      for (const kind of ["curriculum", "school_report", "class_notes"] as const) {
        const f = childInfo.files[kind];
        if (f) fd.append(`file_${kind}`, f);
      }

      const res = await submitIntake(fd);
      if (res && !res.ok) setError(res.error ?? "Submission failed");
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <ChildInfoSection number={1} value={v.childInfo} onChange={(n) => patch("childInfo", n)} />
      <LearningBackgroundSection
        number={2}
        value={v.learning_background}
        onChange={(n) => patch("learning_background", n)}
      />
      <StrengthsSection number={3} value={v.strengths} onChange={(n) => patch("strengths", n)} />
      <ChallengesSection number={4} value={v.challenges} onChange={(n) => patch("challenges", n)} />
      <MotivationSection number={5} value={v.motivation} onChange={(n) => patch("motivation", n)} />
      <BehaviourSection number={6} value={v.behaviour} onChange={(n) => patch("behaviour", n)} />
      <PersonalitySection
        number={7}
        value={v.personality}
        onChange={(n) => patch("personality", n)}
      />
      <GoalsSection number={8} value={v.goals} onChange={(n) => patch("goals", n)} />

      {error && (
        <div
          role="alert"
          className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-4 py-3 text-[14px] font-semibold text-coral"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
        <p className="text-[13px] text-g600">
          You can update your answers later from your dashboard.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit intake"}
        </Button>
      </div>
    </form>
  );
}
