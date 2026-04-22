"use client";

import { useState, useTransition } from "react";
import {
  archiveSubject,
  createSubject,
  renameSubject,
} from "@/lib/actions/subjects";
import { inputBase } from "@/components/ui/FormField";

export type SubjectRow = {
  id: string;
  name: string;
  slug: string;
  is_archived: boolean;
};

function AddSubjectForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const value = name;
    startTransition(async () => {
      const res = await createSubject(value);
      if (res.ok) setName("");
      else setError(res.error);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border-[1.5px] border-navy/10 bg-white p-5"
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

function SubjectListItem({ row }: { row: SubjectRow }) {
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

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-[1.5px] px-5 py-4 ${
        row.is_archived ? "border-g100 bg-g50" : "border-navy/10 bg-white"
      }`}
    >
      <div className="flex-1 min-w-[220px]">
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
              className={`font-heading text-[16px] font-extrabold ${
                row.is_archived ? "text-g600" : "text-navy"
              }`}
            >
              {row.name}
              {row.is_archived && (
                <span className="ml-3 inline-flex items-center rounded-pill border-[1.5px] border-g400/40 bg-white px-2 py-[2px] font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-g600">
                  Archived
                </span>
              )}
            </h3>
            <p className="mt-1 text-[12px] text-g400">{row.slug}</p>
          </div>
        )}
        {error && <p className="mt-2 text-[12px] font-semibold text-coral">{error}</p>}
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
    </li>
  );
}

export function SubjectsManager({ rows }: { rows: SubjectRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <AddSubjectForm />
      {rows.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No subjects yet. Add your first above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <SubjectListItem key={r.id} row={r} />
          ))}
        </ul>
      )}
    </div>
  );
}
