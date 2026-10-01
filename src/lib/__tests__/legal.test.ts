import { describe, expect, it } from "vitest";
import * as legal from "@/lib/marketing/legal";
import * as promise from "@/lib/marketing/promise";
import { guides } from "@/lib/marketing/guides";

/** Every string reachable from a module export, deeply. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

describe("legal, promise and guide copy", () => {
  const all = [...strings(legal), ...strings(promise), ...strings(guides)];

  it("has no TODO placeholders left (fill them in src/lib/marketing/legal.ts)", () => {
    const todos = all.filter((s) => s.includes("TODO_"));
    expect(todos).toEqual([]);
  });

  it("uses no dashes in customer facing copy", () => {
    const dashed = all.filter((s) => /[–—]| - /.test(s));
    expect(dashed).toEqual([]);
  });
});
