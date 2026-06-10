import 'server-only';

import type { BouquetSellableOption } from '@/lib/bouquetOptions';
import { getCatalogImageVariantKey } from '@/lib/catalogCms';
import { isStorefrontCatalogImage } from '@/lib/catalog/storefrontImages';
import { catalogPublicUrl } from '@/lib/catalog/storage';
import { getCatalogProductImagesForEntity } from '@/lib/db/catalogRead';
import { stemVariantKey, type PricingType } from '@/lib/catalog/pricing';
import type { CatalogProductImageRow } from '@/lib/catalog/types';

export type VariantImageSet = { urls: string[]; alts: string[] };

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

function rowsToUrls(rows: CatalogProductImageRow[]): VariantImageSet {
  const sorted = [...rows].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || Number(b.is_primary) - Number(a.is_primary)
  );
  const urls: string[] = [];
  const alts: string[] = [];
  for (const row of sorted) {
    if (!row.storage_path || !isStorefrontCatalogImage({ storage_path: row.storage_path, metadata: row.metadata })) {
      continue;
    }
    const publicUrl = row.public_url?.trim();
    urls.push(publicUrl && !isLegacyRemoteCdnUrl(publicUrl) ? publicUrl : catalogPublicUrl(row.storage_path));
    alts.push(row.alt_en?.trim() || row.alt_th?.trim() || '');
  }
  return { urls, alts };
}

/** Load main + per-variant image sets for a bouquet PDP. */
export async function loadBouquetVariantImages(
  bouquetId: string
): Promise<{ main: VariantImageSet; byVariantKey: Map<string, VariantImageSet> }> {
  const rows = await getCatalogProductImagesForEntity('bouquet', bouquetId);
  const mainRows: CatalogProductImageRow[] = [];
  const byVariantKey = new Map<string, CatalogProductImageRow[]>();

  for (const row of rows) {
    const vk = getCatalogImageVariantKey(row);
    if (!vk) {
      mainRows.push(row);
      continue;
    }
    const list = byVariantKey.get(vk) ?? [];
    list.push(row);
    byVariantKey.set(vk, list);
  }

  const byVariant = new Map<string, VariantImageSet>();
  for (const [vk, list] of Array.from(byVariantKey.entries())) {
    byVariant.set(vk, rowsToUrls(list));
  }

  return { main: rowsToUrls(mainRows), byVariantKey: byVariant };
}

export function attachVariantImagesToSellableOptions(
  sizes: BouquetSellableOption[],
  pricingType: PricingType,
  byVariantKey: Map<string, VariantImageSet>
): BouquetSellableOption[] {
  if (!byVariantKey.size) return sizes;

  return sizes.map((size) => {
    const key =
      pricingType === 'stem_count' && size.stemCount != null
        ? stemVariantKey(size.stemCount)
        : size.key ?? size.optionId.replace(/^(legacy_|size_|fixed_)/, '');
    const images = byVariantKey.get(key);
    if (!images?.urls.length) return size;
    return {
      ...size,
      imageUrl: images.urls[0],
      imageUrls: images.urls,
      imageAlts: images.alts,
    };
  });
}
