import 'server-only';

import { fetchAllPages } from '@/lib/db/pagination';
import { queryOne, queryRows } from '@/lib/db/client';
import type {
  CatalogBouquetRow,
  CatalogPartnerRow,
  CatalogProductImageRow,
  CatalogProductRow,
  CatalogSiteSettingsRow,
  CatalogEntityType,
} from '@/lib/catalog/types';

export async function fetchApprovedBouquetRows(): Promise<CatalogBouquetRow[]> {
  return fetchAllPages<CatalogBouquetRow>((limit, offset) => ({
    sql: `SELECT * FROM catalog_bouquets
          WHERE status = 'approved'
          ORDER BY name_en ASC
          LIMIT $1 OFFSET $2`,
    params: [limit, offset],
  }));
}

export async function fetchLiveProductRows(): Promise<CatalogProductRow[]> {
  return fetchAllPages<CatalogProductRow>((limit, offset) => ({
    sql: `SELECT * FROM catalog_products
          WHERE moderation_status = 'live'
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2`,
    params: [limit, offset],
  }));
}

export async function loadPartnersByIds(ids: string[]): Promise<Map<string, CatalogPartnerRow>> {
  const map = new Map<string, CatalogPartnerRow>();
  if (!ids.length) return map;

  const rows = await queryRows<CatalogPartnerRow>(
    `SELECT * FROM catalog_partners WHERE id = ANY($1::uuid[])`,
    [ids]
  );

  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

export async function fetchBouquetBySlug(
  slug: string,
  locale: 'en' | 'th'
): Promise<CatalogBouquetRow | null> {
  const col = locale === 'th' ? 'slug_th' : 'slug_en';
  let row = await queryOne<CatalogBouquetRow>(
    `SELECT * FROM catalog_bouquets WHERE ${col} = $1 AND status = 'approved' LIMIT 1`,
    [slug]
  );

  if (!row && locale === 'en') {
    row = await queryOne<CatalogBouquetRow>(
      `SELECT * FROM catalog_bouquets WHERE slug_th = $1 AND status = 'approved' LIMIT 1`,
      [slug]
    );
  }

  return row;
}

export async function fetchBouquetByLegacySanityId(legacyId: string): Promise<CatalogBouquetRow | null> {
  return queryOne<CatalogBouquetRow>(
    `SELECT * FROM catalog_bouquets WHERE legacy_sanity_id = $1 LIMIT 1`,
    [legacyId]
  );
}

export async function fetchBouquetById(bouquetId: string): Promise<CatalogBouquetRow | null> {
  return queryOne<CatalogBouquetRow>(
    `SELECT * FROM catalog_bouquets WHERE id = $1 LIMIT 1`,
    [bouquetId]
  );
}

export async function fetchProductBySlug(
  slug: string,
  locale: 'en' | 'th'
): Promise<CatalogProductRow | null> {
  const col = locale === 'th' ? 'slug_th' : 'slug_en';
  return queryOne<CatalogProductRow>(
    `SELECT * FROM catalog_products WHERE ${col} = $1 AND moderation_status = 'live' LIMIT 1`,
    [slug]
  );
}

export async function fetchProductRowById(productId: string): Promise<CatalogProductRow | null> {
  const byId = await queryOne<CatalogProductRow>(
    `SELECT * FROM catalog_products WHERE id = $1 LIMIT 1`,
    [productId]
  );
  if (byId) return byId;

  return queryOne<CatalogProductRow>(
    `SELECT * FROM catalog_products WHERE legacy_sanity_id = $1 LIMIT 1`,
    [productId]
  );
}

export async function fetchPartnerById(partnerId: string): Promise<CatalogPartnerRow | null> {
  return queryOne<CatalogPartnerRow>(
    `SELECT * FROM catalog_partners WHERE id = $1 LIMIT 1`,
    [partnerId]
  );
}

export async function fetchSiteSettings(): Promise<CatalogSiteSettingsRow | null> {
  return queryOne<CatalogSiteSettingsRow>(
    `SELECT * FROM catalog_site_settings WHERE id = 'default' LIMIT 1`
  );
}

export async function getCatalogProductImagesForEntity(
  entityType: CatalogEntityType,
  entityId: string
): Promise<CatalogProductImageRow[]> {
  return queryRows<CatalogProductImageRow>(
    `SELECT * FROM catalog_product_images
     WHERE entity_type = $1
       AND entity_id = $2
       AND revision_id IS NULL
       AND deleted_at IS NULL
     ORDER BY sort_order ASC, created_at ASC`,
    [entityType, entityId]
  );
}
