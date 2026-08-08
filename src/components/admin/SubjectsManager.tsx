"use client";

import { useState, useTransition } from "react";
import {
  archiveSubject,
  createSubject,
  renameSubject,
} from "@/lib/actions/subjects";
import { archiveSkill, createSkill, updateSkill } from "@/lib/actions/skills";
import { inputBase } from "@/components/ui/FormField";

export type SubjectRow = {
  id: string;
  name: string;
  slug: string;
  is_archived: boolean;
};

export type SkillRow = {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_archived: boolean;
};

function AddSubjectForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const value = name;
    startTransition(async () => {
      const res = await createSubject(value);
      if (res.ok) {
        setName("");
        onCreated(res.id);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-5"
    >
      <label className="flex flex-1 min-w-[220px] flex-col gap-[6px]">
        <span className="font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-g400">
          Add a subject
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Further Mathematics"
          className={inputBase}
          required
        />
      </label>
      <button
        type="submit"
        disabled={pending || name.trim().length === 0}
        className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-6 py-[11px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add subject"}
      </button>
      {error && (
        <p className="w-full text-[12px] font-semibold text-coral">{error}</p>
      )}
    </form>
  );
}

function AddSkillForm({
  subjectId,
  nextSortOrder,
}: {
  subjectId: string;
  nextSortOrder: number;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const value = name;
    startTransition(async () => {
      const res = await createSkill(subjectId, value, undefined, nextSortOrder);
      if (res.ok) setName("");
      else setError(res.error);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-line bg-white p-4"
    >
      <label className="flex flex-1 min-w-[200px] flex-col gap-[6px]">
        <span className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
          Add a skill
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fractions"
          className={`${inputBase} py-2 text-[14px]`}
          required
        />
      </label>
      <button
        type="submit"
        disabled={pending || name.trim().length === 0}
        className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-white px-5 py-[9px] font-heading text-[12px] font-bold text-navy transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add skill"}
      </button>
      {error && (
        <p className="w-full text-[12px] font-semibold text-coral">{error}</p>
      )}
    </form>
  );
}

function SkillListItem({
  row,
  canMoveUp,
  canMoveDown,
  movePending,
  onMoveUp,
  onMoveDown,
}: {
  row: SkillRow;
  canMoveUp: boolean;
  canMoveDown: boolean;
  movePending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (name.trim() === row.name) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateSkill(row.id, {
        name,
        description: row.description ?? undefined,
        sortOrder: row.sort_order,
      });
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  };

  const toggleArchive = () => {
    setError(null);
    startTransition(async () => {
      const res = await archiveSkill(row.id, !row.is_archived);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 ${
        row.is_archived ? "border-line bg-paper" : "border-navy/10 bg-white"
      }`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canMoveUp || movePending}
          onClick={onMoveUp}
          aria-label="Move skill up"
          className="flex h-6 w-6 items-center justify-center rounded text-g400 hover:text-navy disabled:pointer-events-none disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={!canMoveDown || movePending}
          onClick={onMoveDown}
          aria-label="Move skill down"
          className="flex h-6 w-6 items-center justify-center rounded text-g400 hover:text-navy disabled:pointer-events-none disabled:opacity-30"
        >
          ↓
        </button>
      </div>

      <div className="flex-1 min-w-[180px]">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setName(row.name);
                  setEditing(false);
                }
              }}
              autoFocus
              className={`${inputBase} py-[6px] text-[13px]`}
            />
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="font-heading text-[12px] font-bold text-blue disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setName(row.name);
                setEditing(false);
                setError(null);
              }}
              className="font-heading text-[12px] font-semibold text-g600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <p
              className={`font-heading text-[14px] font-semibold ${
                row.is_archived ? "text-g600" : "text-navy"
              }`}
            >
              {row.name}
              {row.is_archived && (
                <span className="ml-2 inline-flex items-center rounded-pill border border-g400/40 bg-white px-2 py-[1px] font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-g600">
                  Archived
                </span>
              )}
            </p>
            {row.description && (
              <p className="mt-0.5 text-[12px] text-g400">{row.description}</p>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-[12px] font-semibold text-coral">{error}</p>}
      </div>

      {!editing && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-heading text-[12px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            Rename
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={toggleArchive}
            className="font-heading text-[12px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
          >
            {row.is_archived ? "Unarchive" : "Archive"}
          </button>
        </div>
      )}
    </li>
  );
}

function SubjectSkillsPanel({
  subjectId,
  skills,
}: {
  subjectId: string;
  skills: SkillRow[];
}) {
  const [movePending, startMoveTransition] = useTransition();
  const sorted = [...skills].sort((a, b) => a.sort_order - b.sort_order);
  const activeCount = sorted.filter((s) => !s.is_archived).length;
  const nextSortOrder =
    sorted.length > 0 ? Math.max(...sorted.map((s) => s.sort_order)) + 1 : 0;

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    startMoveTransition(async () => {
      await Promise.all([
        updateSkill(a.id, {
          name: a.name,
          description: a.description ?? undefined,
          sortOrder: b.sort_order,
        }),
        updateSkill(b.id, {
          name: b.name,
          description: b.description ?? undefined,
          sortOrder: a.sort_order,
        }),
      ]);
    });
  };

  return (
    <div className="border-t border-line bg-paper/60 px-5 py-4">
      {activeCount === 0 && (
        <p className="mb-3 rounded-md border border-blue/30 bg-blue/10 px-4 py-3 text-[13px] text-navy">
          No skills yet — lesson reports for this subject render without a skill-tracker block
          until at least one skill is added.
        </p>
      )}
      {sorted.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {sorted.map((s, i) => (
            <SkillListItem
              key={s.id}
              row={s}
              canMoveUp={i > 0}
              canMoveDown={i < sorted.length - 1}
              movePending={movePending}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
            />
          ))}
        </ul>
      )}
      <AddSkillForm subjectId={subjectId} nextSortOrder={nextSortOrder} />
    </div>
  );
}

function SubjectListItem({
  row,
  skills,
  expanded,
  onToggleExpand,
}: {
  row: SubjectRow;
  skills: SkillRow[];
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (name.trim() === row.name) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await renameSubject(row.id, name);
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  };

  const toggleArchive = () => {
    setError(null);
    startTransition(async () => {
      const res = await archiveSubject(row.id, !row.is_archived);
      if (!res.ok) setError(res.error);
    });
  };

  const activeSkillCount = skills.filter((s) => !s.is_archived).length;

  return (
    <li
      className={`overflow-hidden rounded-lg border ${
        row.is_archived ? "border-line bg-paper" : "border-navy/10 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          aria-expanded={expanded}
          className="flex flex-1 min-w-[220px] cursor-pointer items-start gap-2 text-left"
        >
          <span
            className={`mt-1 inline-block text-[11px] text-g400 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          >
            ▶
          </span>
          <span className="flex-1">
            {editing ? (
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") {
                      setName(row.name);
                      setEditing(false);
                    }
                  }}
                  autoFocus
                  className={`${inputBase} py-2 text-[14px]`}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={save}
                  className="font-heading text-[13px] font-bold text-blue disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(row.name);
                    setEditing(false);
                    setError(null);
                  }}
                  className="font-heading text-[13px] font-semibold text-g600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <h3
                  className={`font-heading text-[16px] font-semibold ${
                    row.is_archived ? "text-g600" : "text-navy"
                  }`}
                >
                  {row.name}
                  {row.is_archived && (
                    <span className="ml-3 inline-flex items-center rounded-pill border border-g400/40 bg-white px-2 py-[2px] font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-g600">
                      Archived
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-[12px] text-g400">
                  {row.slug} · {activeSkillCount}{" "}
                  {activeSkillCount === 1 ? "skill" : "skills"}
                </p>
              </div>
            )}
            {error && (
              <p className="mt-2 text-[12px] font-semibold text-coral">{error}</p>
            )}
          </span>
        </div>

        {!editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
            >
              Rename
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={toggleArchive}
              className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
            >
              {row.is_archived ? "Unarchive" : "Archive"}
            </button>
          </div>
        )}
      </div>

      {expanded && <SubjectSkillsPanel subjectId={row.id} skills={skills} />}
    </li>
  );
}

export function SubjectsManager({
  rows,
  skillRows,
}: {
  rows: SubjectRow[];
  skillRows: SkillRow[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const skillsBySubject = skillRows.reduce<Record<string, SkillRow[]>>((acc, s) => {
    (acc[s.subject_id] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <AddSubjectForm onCreated={(id) => setExpandedId(id)} />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No subjects yet. Add your first above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <SubjectListItem
              key={r.id}
              row={r}
              skills={skillsBySubject[r.id] ?? []}
              expanded={expandedId === r.id}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === r.id ? null : r.id))
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
