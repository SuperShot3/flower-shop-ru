import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { isThailandSupabaseCredential } from '@/lib/env/validateRussiaEnv';

let adminClient: SupabaseClient | null | undefined;

function readSupabaseUrl(): string | null {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url || isThailandSupabaseCredential(url)) return null;
  return url;
}

function readServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || isThailandSupabaseCredential(key)) return null;
  return key;
}

function readAnonKey(): string | null {
  const key =
    process.env.SUPABASE_ANON_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key || isThailandSupabaseCredential(key)) return null;
  return key;
}

/** Service-role client for admin APIs, storage uploads, and server-side Postgres via Supabase JS. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;

  const url = readSupabaseUrl();
  const key = readServiceRoleKey();
  if (!url || !key) {
    adminClient = null;
    return null;
  }

  adminClient = createClient(url, key, { auth: { persistSession: false } });
  return adminClient;
}

/** Anon client scoped to a customer order via x-order-token (RLS on orders / order_items). */
export function createSupabaseAnonWithOrderToken(orderToken: string): SupabaseClient | null {
  const url = readSupabaseUrl();
  const anonKey = readAnonKey();
  const token = orderToken.trim();
  if (!url || !anonKey || !token) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'x-order-token': token,
      },
    },
  });
}
