/** Client-safe helpers for cart line thumbnails (localStorage + checkout UI). */

const LEGACY_REMOTE_IMAGE_MARKERS = ['cdn.sanity.io', 'sanity.io', 'blob.vercel-storage.com'] as const;

/** URLs that must never be rendered or persisted in cart thumbnails. */
export function isLegacyCartImageUrl(url: string | undefined): boolean {
  const raw = (url ?? '').trim();
  if (!raw) return false;
  if (LEGACY_REMOTE_IMAGE_MARKERS.some((marker) => raw.includes(marker))) return true;
  // Relative Supabase paths only resolve on the Supabase host, not the storefront origin.
  if (raw.startsWith('/storage/v1/object/public/')) return true;
  return false;
}

/** True when a cart line can show this thumbnail without refetching from /api/catalog/image. */
export function isUsableCartImageUrl(url: string | undefined): boolean {
  const raw = (url ?? '').trim();
  if (!raw || isLegacyCartImageUrl(raw)) return false;
  if (raw.startsWith('data:')) return true;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Match catalog cards: bypass Next image optimizer for data URLs and Supabase Storage. */
export function shouldUnoptimizeCartImageUrl(url: string): boolean {
  const raw = url.trim();
  return raw.startsWith('data:') || raw.includes('supabase.co');
}

export function sanitizeCartImageUrl(url: string | undefined): string | undefined {
  return isUsableCartImageUrl(url) ? url!.trim() : undefined;
}
