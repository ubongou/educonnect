"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { stripEmpty } from "@/components/intake/IntakeForm";
import {
  LearningBackgroundSection,
  emptyLearningBackground,
  type LearningBackgroundValues,
} from "@/components/intake/sections/LearningBackgroundSection";
import {
  StrengthsSection,
  emptyStrengths,
  type StrengthsValues,
} from "@/components/intake/sections/StrengthsSection";
import {
  ChallengesSection,
  emptyChallenges,
  type ChallengesValues,
} from "@/components/intake/sections/ChallengesSection";
import {
  MotivationSection,
  emptyMotivation,
  type MotivationValues,
} from "@/components/intake/sections/MotivationSection";
import {
  BehaviourSection,
  emptyBehaviour,
  type BehaviourValues,
} from "@/components/intake/sections/BehaviourSection";
import {
  PersonalitySection,
  emptyPersonality,
  type PersonalityValues,
} from "@/components/intake/sections/PersonalitySection";
import {
  GoalsSection,
  emptyGoals,
  type GoalsValues,
} from "@/components/intake/sections/GoalsSection";
import { updateStudentIntake } from "@/lib/actions/students";
import type { IntakeJson } from "@/types/domain";

type Values = {
  learning_background: LearningBackgroundValues;
  strengths: StrengthsValues;
  challenges: ChallengesValues;
  motivation: MotivationValues;
  behaviour: BehaviourValues;
  personality: PersonalityValues;
  goals: GoalsValues;
};

/** Stored answers laid over the blank form, so every field is controlled. */
function fromIntake(i: IntakeJson): Values {
  return {
    learning_background: { ...emptyLearningBackground, ...i.learning_background },
    strengths: { ...emptyStrengths, ...i.strengths },
    challenges: { ...emptyChallenges, ...i.challenges },
    motivation: { ...emptyMotivation, ...i.motivation },
    behaviour: { ...emptyBehaviour, ...i.behaviour },
    personality: { ...emptyPersonality, ...i.personality },
    goals: { ...emptyGoals, ...i.goals },
  };
}

/**
 * Admin editor for the intake questionnaire (sections 2–8 of the parent
 * sign-up form), all on one page, reusing the parent-facing sections.
 */
export function AdminIntakeForm({
  studentId,
  initial,
}: {
  studentId: string;
  initial: IntakeJson;
}) {
  const router = useRouter();
  const [v, setV] = useState<Values>(() => fromIntake(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const patch = <K extends keyof Values>(key: K, next: Values[K]) =>
    setV((prev) => ({ ...prev, [key]: next }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await updateStudentIntake(studentId, {
          learning_background: stripEmpty(v.learning_background),
          strengths: stripEmpty(v.strengths),
          challenges: stripEmpty(v.challenges),
          motivation: stripEmpty(v.motivation),
          behaviour: stripEmpty(v.behaviour),
          personality: stripEmpty(v.personality),
          goals: stripEmpty(v.goals),
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/admin/students/${studentId}`);
        router.refresh();
      } catch {
        setError("Couldn't save. Check your internet connection and try again.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <LearningBackgroundSection
        number={1}
        value={v.learning_background}
        onChange={(n) => patch("learning_background", n)}
      />
      <StrengthsSection number={2} value={v.strengths} onChange={(n) => patch("strengths", n)} />
      <ChallengesSection
        number={3}
        value={v.challenges}
        onChange={(n) => patch("challenges", n)}
      />
      <MotivationSection
        number={4}
        value={v.motivation}
        onChange={(n) => patch("motivation", n)}
      />
      <BehaviourSection number={5} value={v.behaviour} onChange={(n) => patch("behaviour", n)} />
      <PersonalitySection
        number={6}
        value={v.personality}
        onChange={(n) => patch("personality", n)}
      />
      <GoalsSection number={7} value={v.goals} onChange={(n) => patch("goals", n)} />

      {error && (
        <div
          role="alert"
          className="rounded-md border-[1.5px] border-coral/40 bg-coral/10 px-4 py-3 text-[14px] font-semibold text-coral"
        >
          {error}
        </div>
      )}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border-[1.5px] border-navy/10 bg-white p-5">
        <button
          type="button"
          onClick={() => router.push(`/admin/students/${studentId}`)}
          disabled={pending}
          className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save answers"}
        </Button>
      </div>
    </form>
  );
}
