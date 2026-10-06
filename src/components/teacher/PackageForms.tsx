"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addPackageSessions,
  cancelPackage,
  confirmPackage,
  createPackage,
  removePackageSession,
  updatePackage,
} from "@/lib/actions/packages";

/** A lesson as the forms show it; `when` is formatted on the server. */
export type LessonOption = {
  id: string;
  when: string;
  statusLabel: string;
  /** Taught or no-show — can't come off a package. */
  happened: boolean;
};

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] text-navy focus:border-blue focus:outline-none";
const primaryBtn =
  "inline-flex items-center justify-center rounded-pill bg-navy px-5 py-2.5 font-heading text-[13px] font-semibold text-yellow transition-opacity hover:opacity-90 disabled:opacity-50";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-pill border border-navy/20 bg-white px-4 py-2 font-heading text-[13px] font-semibold text-navy hover:bg-paper disabled:opacity-50";
const linkBtn =
  "font-heading text-[13px] font-semibold underline-offset-4 hover:underline disabled:opacity-50";

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-[13px] font-semibold text-coral">
      {error}
    </p>
  );
}

function LessonChecklist({
  lessons,
  selected,
  onToggle,
  empty,
}: {
  lessons: LessonOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  empty: string;
}) {
  if (lessons.length === 0) {
    return <p className="text-[13px] text-g600">{empty}</p>;
  }
  return (
    <ul className="flex max-h-[360px] flex-col divide-y divide-line overflow-y-auto rounded-xl border border-line">
      {lessons.map((l) => (
        <li key={l.id}>
          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-paper">
            <input
              type="checkbox"
              checked={selected.has(l.id)}
              onChange={() => onToggle(l.id)}
              className="h-4 w-4 accent-navy"
            />
            <span className="flex-1 text-navy">{l.when}</span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-g400">
              {l.statusLabel}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function useSelection(initial: string[] = []) {
  const [selected, setSelected] = useState(() => new Set(initial));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return { selected, toggle, clear: () => setSelected(new Set()) };
}

/** Start a package: size, note, and the lessons that count towards it. */
export function NewPackageForm({
  enrollmentId,
  lessons,
  defaultSize = 8,
}: {
  enrollmentId: string;
  lessons: LessonOption[];
  defaultSize?: number;
}) {
  const router = useRouter();
  const [size, setSize] = useState(String(defaultSize));
  const [note, setNote] = useState("");
  // Upcoming lessons pre-ticked, oldest first, up to the size — the common case
  // is "the next N booked lessons".
  const { selected, toggle } = useSelection(
    lessons.filter((l) => !l.happened).slice(0, defaultSize).map((l) => l.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sizeNum = Number(size);
  const over = Number.isFinite(sizeNum) && selected.size > sizeNum;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createPackage({
        enrollment_id: enrollmentId,
        size,
        note,
        session_ids: [...selected],
      });
      if (res.ok) router.push(`/teacher/packages/${res.packageId}`);
      else setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-g400">
            Lessons in package
          </span>
          <input
            type="number"
            min={1}
            max={200}
            inputMode="numeric"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-g400">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            placeholder="e.g. Twice a week until half-term"
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-g400">
          Lessons to count towards it · {selected.size} ticked
        </p>
        <LessonChecklist
          lessons={lessons}
          selected={selected}
          onToggle={toggle}
          empty="No lessons to add yet. Start the package now and add lessons as they're booked."
        />
        {over && (
          <p className="text-[13px] text-coral">
            You&apos;ve ticked more lessons than the package size.
          </p>
        )}
      </div>

      <ErrorText error={error} />
      <div>
        <button type="button" onClick={submit} disabled={pending || over} className={primaryBtn}>
          {pending ? "Starting…" : "Start package"}
        </button>
      </div>
    </div>
  );
}

/** Everything a teacher can do to an open package. */
export function PackageManager({
  packageId,
  size,
  note,
  lessons,
  addable,
  needsNoteToConfirm,
  canConfirm,
  canCancel,
  doneCount,
}: {
  packageId: string;
  size: number;
  note: string | null;
  lessons: LessonOption[];
  addable: LessonOption[];
  needsNoteToConfirm: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  doneCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [sizeDraft, setSizeDraft] = useState(String(size));
  const [noteDraft, setNoteDraft] = useState(note ?? "");

  const { selected, toggle, clear } = useSelection();
  const [confirmNote, setConfirmNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <ErrorText error={error} />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-[16px] font-semibold text-navy">Lessons on this package</h2>
        {lessons.length === 0 ? (
          <p className="text-[13px] text-g600">No lessons on it yet — add some below.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white">
            {lessons.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
                <span className="flex-1 text-navy">{l.when}</span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-g400">
                  {l.statusLabel}
                </span>
                {!l.happened && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => removePackageSession(packageId, l.id))}
                    className={`${linkBtn} text-g600 hover:text-coral`}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-[16px] font-semibold text-navy">Add lessons</h2>
        <LessonChecklist
          lessons={addable}
          selected={selected}
          onToggle={toggle}
          empty="No other lessons for this child and subject are free to add."
        />
        {addable.length > 0 && (
          <div>
            <button
              type="button"
              disabled={pending || selected.size === 0}
              onClick={() => run(() => addPackageSessions(packageId, [...selected]), clear)}
              className={secondaryBtn}
            >
              Add {selected.size || ""} lesson{selected.size === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-[16px] font-semibold text-navy">Package details</h2>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-g600">Lessons in package</span>
              <input
                type="number"
                min={1}
                max={200}
                value={sizeDraft}
                onChange={(e) => setSizeDraft(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-g600">Note</span>
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                maxLength={2000}
                className={inputClass}
              />
            </label>
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => updatePackage({ package_id: packageId, size: sizeDraft, note: noteDraft }),
                    () => setEditing(false),
                  )
                }
                className={primaryBtn}
              >
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className={secondaryBtn}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button type="button" onClick={() => setEditing(true)} className={secondaryBtn}>
              Change size or note
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5">
        <h2 className="font-heading text-[16px] font-semibold text-navy">Confirm complete</h2>
        {!canConfirm ? (
          <p className="text-[13px] text-g600">
            You can confirm once at least one lesson on this package has been taught or marked a
            no-show.
          </p>
        ) : !confirming ? (
          <>
            <p className="text-[13px] text-g600">
              {needsNoteToConfirm
                ? `Only ${doneCount} of ${size} lessons have happened. You can still end the package now — you'll be asked why.`
                : "Every lesson on this package has happened. Confirm it and the office will be told."}
            </p>
            <div>
              <button type="button" onClick={() => setConfirming(true)} className={primaryBtn}>
                Confirm complete
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-g600">
                {needsNoteToConfirm ? "Why are you ending it early? (required)" : "Note for the office (optional)"}
              </span>
              <textarea
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                maxLength={2000}
                rows={3}
                className={inputClass}
              />
            </label>
            {needsNoteToConfirm && (
              <p className="text-[12px] text-g600">
                Lessons on it that haven&apos;t happened yet will come off, ready for the next package.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={pending || (needsNoteToConfirm && confirmNote.trim() === "")}
                onClick={() => run(() => confirmPackage({ package_id: packageId, note: confirmNote }))}
                className={primaryBtn}
              >
                {pending ? "Sending…" : "Send to office"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={secondaryBtn}>
                Back
              </button>
            </div>
          </>
        )}
      </section>

      {canCancel && (
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this package? Its lessons will be free to add to another.")) return;
              setError(null);
              startTransition(async () => {
                const res = await cancelPackage(packageId);
                if (res.ok) router.push("/teacher/packages");
                else setError(res.error);
              });
            }}
            className={`${linkBtn} text-g600 hover:text-coral`}
          >
            Delete this package
          </button>
        </div>
      )}
    </div>
  );
}
