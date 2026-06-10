import 'server-only';

import { Pool, type QueryResultRow } from 'pg';
import { resolveDatabaseUrl } from '@/lib/db/resolveDatabaseUrl';

export { resolveDatabaseUrl, requireDatabaseUrl } from '@/lib/db/resolveDatabaseUrl';

export type { QueryResultRow };

let pool: Pool | null = null;

/**
 * pg 8.x treats sslmode=require as verify-full unless uselibpqcompat=true.
 * Managed poolers (Supabase, Neon) need libpq semantics to avoid self-signed cert errors in Node.
 */
function normalizeConnectionString(connectionString: string): string {
  const isLocal = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(connectionString);
  if (isLocal || /sslmode=disable/i.test(connectionString)) {
    return connectionString;
  }
  if (/uselibpqcompat=true/i.test(connectionString)) {
    return connectionString;
  }
  const sep = connectionString.includes('?') ? '&' : '?';
  return `${connectionString}${sep}uselibpqcompat=true`;
}

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
