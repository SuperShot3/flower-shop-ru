import 'server-only';

import { queryRows, type QueryResultRow } from '@/lib/db/client';

/** Paginate catalog reads instead of one oversized SQL response. */
export const CATALOG_FETCH_PAGE_SIZE = 20;

export async function fetchAllPages<T extends QueryResultRow>(
  buildQuery: (limit: number, offset: number) => { sql: string; params: unknown[] },
  pageSize = CATALOG_FETCH_PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  for (;;) {
    const { sql, params } = buildQuery(pageSize, offset);
    const chunk = await queryRows<T>(sql, params);
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}
