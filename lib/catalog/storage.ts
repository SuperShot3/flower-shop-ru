import fs from 'node:fs/promises';
import path from 'node:path';

import type { CatalogStoredImage } from '@/lib/catalog/types';

export const CATALOG_BUCKET = 'catalog';

function isSanityCdnUrl(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.hostname.includes('cdn.sanity.io') || u.hostname.includes('sanity.io');
  } catch {
    return raw.includes('cdn.sanity.io') || raw.includes('sanity.io');
  }
}

/** Public URL for catalog images on the VPS (nginx serves `/catalog/*`). */
export function catalogPublicUrl(storagePath: string): string {
  const rel = storagePath.replace(/^\//, '');
  const base =
    process.env.CATALOG_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/catalog`
      : null);
  if (base) return `${base}/${rel}`;
  return `/catalog/${rel}`;
}

export function storedImagePublicUrl(image: CatalogStoredImage): string {
  const publicUrl = image.public_url?.trim();
  if (publicUrl && !isSanityCdnUrl(publicUrl)) return publicUrl;
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

/** Admin image upload — writes to `CATALOG_STORAGE_DIR` on the VPS. */
export async function uploadBufferToCatalog(
  storagePath: string,
  buffer: Buffer,
  _contentType: string
): Promise<void> {
  const root = process.env.CATALOG_STORAGE_DIR?.trim();
  if (!root) {
    throw new Error('uploadBufferToCatalog: set CATALOG_STORAGE_DIR (e.g. /var/www/catalog).');
  }
  const rel = storagePath.replace(/^\//, '');
  const dest = path.join(root, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
}
