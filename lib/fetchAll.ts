// Supabase returns at most 1000 rows per request and silently cuts the rest.
// fetchAll keeps requesting pages until everything is loaded.
// The query MUST have a stable order (add .order('id') as a tie-breaker) so pages don't overlap.
// Row type is given explicitly (fetchAll<Order>) or defaults to any — not inferred from the query builder.
type PageResult = { data: unknown[] | null; error: { message: string } | null }

export async function fetchAll<T = any>(
  page: (from: number, to: number) => PromiseLike<PageResult>,
  pageSize = 1000,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1)
    if (error) return { data: rows, error }
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < pageSize) break
  }
  return { data: rows, error: null }
}
