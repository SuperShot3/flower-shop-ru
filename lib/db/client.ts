import 'server-only';

import { Pool, type QueryResultRow } from 'pg';
import { normalizeConnectionString, resolveDatabaseUrl } from '@/lib/db/resolveDatabaseUrl';

export {
  normalizeConnectionString,
  resolveDatabaseUrl,
  requireDatabaseUrl,
  requireNormalizedDatabaseUrl,
} from '@/lib/db/resolveDatabaseUrl';

export type { QueryResultRow };

let pool: Pool | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}

export function getPool(): Pool {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      'Missing POSTGRES_URL — set Supabase pooler URL in .env.local or via Vercel Supabase integration.'
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: normalizeConnectionString(connectionString),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
}

export async function queryRows<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

/** Require Postgres for catalog reads. */
export function requireDb(): Pool {
  return getPool();
}
