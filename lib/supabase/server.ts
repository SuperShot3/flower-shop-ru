import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * @deprecated Thailand Supabase runtime removed. Use `@/lib/db/client` for Postgres.
 * Returns null — admin modules that still call Supabase APIs are not wired for RU MVP yet.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  return null;
}

/** @deprecated Customer order token reads use Postgres in RU storefront. */
export function createSupabaseAnonWithOrderToken(_orderToken: string): SupabaseClient | null {
  return null;
}
