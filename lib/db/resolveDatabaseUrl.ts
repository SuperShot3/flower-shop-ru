/** Canonical Postgres URL — Vercel Supabase sets POSTGRES_URL; DATABASE_URL kept as fallback. */
const POSTGRES_ENV_KEYS = ['POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'DATABASE_URL'] as const;

function looksLikePostgresUrl(value: string): boolean {
  return /^postgres(ql)?:\/\//i.test(value);
}

export function resolveDatabaseUrl(): string | undefined {
  for (const key of POSTGRES_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value && looksLikePostgresUrl(value)) return value;
  }
  return undefined;
}

export function requireDatabaseUrl(): string {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      'Missing POSTGRES_URL — set Supabase pooler URL in .env.local or via Vercel Supabase integration.'
    );
  }
  return url;
}

/**
 * pg 8.x treats sslmode=require as verify-full unless uselibpqcompat=true.
 * Managed poolers (Supabase, Neon) need libpq semantics to avoid self-signed cert errors in Node.
 */
export function normalizeConnectionString(connectionString: string): string {
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

export function requireNormalizedDatabaseUrl(): string {
  return normalizeConnectionString(requireDatabaseUrl());
}
