import { createClient } from "@/lib/supabase/server";
import { requireParent } from "@/lib/auth";

export type ParentChild = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  registration_number: string;
};

/**
 * Loads the parent's linked children in creation order. The page callers
 * use this to build <ChildTabs> and to resolve the `?child=` query param
 * into a concrete student id.
 *
 * Pair with `pickChild(children, idFromQuery)` so every page has the same
 * fallback behaviour: if the query param is missing or doesn't match one
 * of the parent's students we default to the first child.
 */
export async function getParentChildren(pathname: string): Promise<{
  children: ParentChild[];
}> {
  await requireParent(pathname);
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, full_name, preferred_name, registration_number, created_at")
    .order("created_at", { ascending: true });

  const children: ParentChild[] = (data ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    preferred_name: s.preferred_name,
    registration_number: s.registration_number,
  }));

  return { children };
}

export function pickChild(
  children: ParentChild[],
  idFromQuery: string | undefined,
): ParentChild | null {
  if (children.length === 0) return null;
  if (idFromQuery) {
    const match = children.find((c) => c.id === idFromQuery);
    if (match) return match;
  }
  return children[0];
}

const dotPalette = ["#FCB936", "#3EBEFF", "#FF693F", "#42DBFD", "#000000"];

/** Rotating dot-colour palette for <ChildTabs>. */
export function childTabColor(i: number): string {
  return dotPalette[i % dotPalette.length]!;
}
