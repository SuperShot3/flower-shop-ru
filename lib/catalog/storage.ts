import 'server-only';

import type { CatalogStoredImage } from '@/lib/catalog/types';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const CATALOG_BUCKET = 'catalog';

function isLegacyRemoteCdnUrl(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.hostname.includes('cdn.sanity.io') || u.hostname.includes('sanity.io');
  } catch {
    return raw.includes('cdn.sanity.io') || raw.includes('sanity.io');
  }
}

function normalizeStoragePath(storagePath: string): string {
  return storagePath.trim().replace(/^\/+/, '');
}

/** Public URL for a file in Supabase Storage (public bucket). */
export function supabaseStoragePublicUrl(bucket: string, storagePath: string): string {
  const rel = normalizeStoragePath(storagePath);
  const cdnBase = process.env.CATALOG_CDN_URL?.replace(/\/$/, '');
  if (bucket === CATALOG_BUCKET && cdnBase) {
    return `${cdnBase}/${rel}`;
  }

  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  if (base) {
    return `${base}/storage/v1/object/public/${bucket}/${rel}`;
  }

  return `/storage/v1/object/public/${bucket}/${rel}`;
}

/** Public URL for catalog images in the `catalog` bucket. */
export function catalogPublicUrl(storagePath: string): string {
  return supabaseStoragePublicUrl(CATALOG_BUCKET, storagePath);
}

export function storedImagePublicUrl(image: CatalogStoredImage): string {
  const publicUrl = image.public_url?.trim();
  if (publicUrl && !isLegacyRemoteCdnUrl(publicUrl)) return publicUrl;
  if (!image.storage_path) return publicUrl ?? '';
  return catalogPublicUrl(image.storage_path);
}

export function buildCatalogImageRecord(
  storagePath: string,
  meta: Omit<CatalogStoredImage, 'storage_path' | 'public_url'>
): CatalogStoredImage {
  return {
    storage_path: storagePath,
    public_url: catalogPublicUrl(storagePath),
    ...meta,
  };
}

/** Admin image upload — writes to Supabase Storage `catalog` bucket. */
export async function uploadBufferToCatalog(
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      'uploadBufferToCatalog: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for Russia Supabase.'
    );
  }

  const rel = normalizeStoragePath(storagePath);
  const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(rel, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`uploadBufferToCatalog: ${error.message}`);
  }
}
