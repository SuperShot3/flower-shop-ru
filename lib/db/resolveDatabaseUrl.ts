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
