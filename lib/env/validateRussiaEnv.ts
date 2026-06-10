/**
 * Fail fast when Thailand runtime credentials are present.
 * Russia storefront uses Neon/VPS Postgres + this repo's own Vercel Blob — never Thailand Supabase or Stripe.
 */

const FORBIDDEN_RUNTIME_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_GTM_ID',
  'RESEND_API_KEY',
] as const;

export function getForbiddenRuntimeEnvVars(): string[] {
  return FORBIDDEN_RUNTIME_VARS.filter((name) => {
    const value = process.env[name]?.trim();
    return Boolean(value);
  });
}

export function assertRussiaRuntimeEnv(): void {
  const forbidden = getForbiddenRuntimeEnvVars();
  if (forbidden.length === 0) return;

  const message = [
    '[flower_shop_ru] Refusing to start: Thailand / blocked runtime credentials detected.',
    `Remove or unset: ${forbidden.join(', ')}`,
    'This repo is isolated from lannabloom.shop — use DATABASE_URL and Russia-only vars from .env.example.',
  ].join(' ');

  throw new Error(message);
}
