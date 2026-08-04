/**
 * Pages through a PostgREST query until it's exhausted.
 *
 * PostgREST caps every response at the project's `max-rows` (1000 by default),
 * silently — an uncapped `.select()` over a table that has outgrown it returns
 * a short list with no error and no indication anything is missing. That's
 * exactly the failure mode that made scheduled sessions disappear from the
 * admin schedule, so anywhere a query must genuinely see every row (aggregate
 * counters, the reminder sweep), it goes through here instead.
 *
 * Use only for reads that are aggregated, never for anything rendered directly
 * — a paginated UI should page in the UI.
 */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  pageSize = 1000,
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];

  for (let page = 0; ; page++) {
    const from = page * pageSize;
    const { data, error } = await buildQuery(from, from + pageSize - 1);

    if (error) return { rows, error: error.message };

    const batch = data ?? [];
    rows.push(...batch);

    // A short page means we've reached the end. An exactly-full page is
    // ambiguous, so we go round again and accept one wasted request.
    if (batch.length < pageSize) return { rows, error: null };

    // Belt and braces: stop rather than loop forever if the server ignores
    // the range and keeps returning full pages.
    if (page > 100) return { rows, error: null };
  }
}
