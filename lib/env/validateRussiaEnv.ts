/**
 * Fail fast when Thailand runtime credentials are present.
 * Russia Supabase on Vercel sets POSTGRES_URL + SUPABASE_URL — only the Thailand project ref is blocked.
 */

const THAILAND_SUPABASE_PROJECT_REF = 'kwbffyojrdjlehdhpptf';

const FORBIDDEN_RUNTIME_VARS = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_GTM_ID',
  'RESEND_API_KEY',
] as const;

const POSTGRES_ENV_KEYS = ['POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'DATABASE_URL'] as const;

export function isThailandSupabaseCredential(value: string): boolean {
  return value.includes(THAILAND_SUPABASE_PROJECT_REF);
}

function pointsAtThailandSupabase(value: string): boolean {
  return isThailandSupabaseCredential(value);
}

export function getForbiddenRuntimeEnvVars(): string[] {
  const forbidden: string[] = FORBIDDEN_RUNTIME_VARS.filter((name) => {
    const value = process.env[name]?.trim();
    return Boolean(value);
  });

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  if (supabaseUrl && pointsAtThailandSupabase(supabaseUrl)) {
    forbidden.push('SUPABASE_URL');
  }

  const supabaseAnonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseAnonUrl && pointsAtThailandSupabase(supabaseAnonUrl)) {
    forbidden.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  for (const key of POSTGRES_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value && pointsAtThailandSupabase(value)) {
      forbidden.push(key);
    }
  }

  return forbidden;
}

export function assertRussiaRuntimeEnv(): void {
  const forbidden = getForbiddenRuntimeEnvVars();
  if (forbidden.length === 0) return;

  const message = [
    '[flower_shop_ru] Refusing to start: Thailand / blocked runtime credentials detected.',
    `Remove or unset: ${forbidden.join(', ')}`,
    'This repo is isolated from lannabloom.shop — use Russia Supabase (POSTGRES_URL on Vercel) from .env.example.',
  ].join(' ');

  throw new Error(message);
}
