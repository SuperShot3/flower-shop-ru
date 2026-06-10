import 'server-only';

/** Paginate catalog reads instead of one oversized PostgREST response. */
export const CATALOG_FETCH_PAGE_SIZE = 20;

type PageRange = { from: number; to: number };

type PageResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

export async function fetchAllSupabasePages(
  runPageQuery: (page: PageRange) => PromiseLike<PageResult>,
  pageSize = CATALOG_FETCH_PAGE_SIZE
): Promise<unknown[]> {
  const rows: unknown[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await runPageQuery({ from, to: from + pageSize - 1 });
    if (error) throw new Error(error.message);

    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}
