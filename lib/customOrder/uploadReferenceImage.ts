import 'server-only';

import { CATALOG_BUCKET, supabaseStoragePublicUrl } from '@/lib/catalog/storage';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const CUSTOM_ORDER_REFERENCE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const CUSTOM_ORDER_REFERENCE_IMAGE_RETENTION_DAYS = 30;
export const ALLOWED_CUSTOM_ORDER_REFERENCE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

const CUSTOM_ORDER_REFS_PREFIX = 'custom-order-refs';

type AllowedReferenceImageType = (typeof ALLOWED_CUSTOM_ORDER_REFERENCE_IMAGE_TYPES)[number];

function isAllowedReferenceImageType(type: string): type is AllowedReferenceImageType {
  return ALLOWED_CUSTOM_ORDER_REFERENCE_IMAGE_TYPES.includes(type as AllowedReferenceImageType);
}

async function sniffImageMimeType(file: File): Promise<AllowedReferenceImageType | null> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return 'image/gif';
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export async function getValidCustomOrderReferenceImageContentType(
  file: File
): Promise<AllowedReferenceImageType | null> {
  if (!isAllowedReferenceImageType(file.type)) return null;

  const sniffedType = await sniffImageMimeType(file);
  return sniffedType === file.type ? sniffedType : null;
}

/**
 * Upload a reference image for a custom order to Supabase Storage (`catalog` bucket).
 * Returns public URL, or null if Supabase is not configured / upload fails.
 */
export async function uploadCustomOrderReferenceImage(
  file: File,
  uploadKey: string
): Promise<{ url: string } | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || file.size === 0) return null;
  if (file.size > CUSTOM_ORDER_REFERENCE_IMAGE_MAX_BYTES) return null;
  const contentType = await getValidCustomOrderReferenceImageContentType(file);
  if (!contentType) return null;

  const safeName = file.name.replace(/[^\w.\-()]/g, '_').slice(0, 120) || 'image';
  const yyyyMm = new Date().toISOString().slice(0, 7);
  const storagePath = `${CUSTOM_ORDER_REFS_PREFIX}/${yyyyMm}/${uploadKey}/${Date.now()}-${safeName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      console.error('[customOrder] Storage upload failed:', error.message);
      return null;
    }
    return { url: supabaseStoragePublicUrl(CATALOG_BUCKET, storagePath) };
  } catch (e) {
    console.error('[customOrder] Storage upload failed:', e);
    return null;
  }
}

export async function deleteCustomOrderReferenceImagesOlderThan(
  cutoff: Date
): Promise<{ scanned: number; deleted: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { scanned: 0, deleted: 0 };

  let offset = 0;
  const limit = 1000;
  let scanned = 0;
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(CATALOG_BUCKET).list(CUSTOM_ORDER_REFS_PREFIX, {
      limit,
      offset,
      sortBy: { column: 'created_at', order: 'asc' },
    });
    if (error) {
      console.error('[customOrder] Storage list failed:', error.message);
      break;
    }

    const files = data ?? [];
    if (!files.length) break;
    scanned += files.length;

    const expiredPaths = files
      .filter((file) => file.name && file.created_at)
      .filter((file) => new Date(file.created_at!).getTime() < cutoff.getTime())
      .map((file) => `${CUSTOM_ORDER_REFS_PREFIX}/${file.name}`);

    if (expiredPaths.length) {
      const { error: removeError } = await supabase.storage.from(CATALOG_BUCKET).remove(expiredPaths);
      if (removeError) {
        console.error('[customOrder] Storage delete failed:', removeError.message);
        break;
      }
      deleted += expiredPaths.length;
    }

    if (files.length < limit) break;
    offset += limit;
  }

  return { scanned, deleted };
}
