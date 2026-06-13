import type { Locale } from '@/lib/i18n';
import { catalogSlugColumn } from '@/lib/catalogLocale';
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
  locale: Locale
): Promise<CatalogBouquetRow | null> {
  const col = catalogSlugColumn(locale);
  let row = await queryOne<CatalogBouquetRow>(
    `SELECT * FROM catalog_bouquets WHERE ${col} = $1 AND status = 'approved' LIMIT 1`,
    [slug]
  );

  if (!row && locale === 'en') {
    row = await queryOne<CatalogBouquetRow>(
      `SELECT * FROM catalog_bouquets WHERE slug_ru = $1 AND status = 'approved' LIMIT 1`,
      [slug]
    );
  }

  return row;
}

export async function fetchBouquetByLegacyImportId(legacyId: string): Promise<CatalogBouquetRow | null> {
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
  locale: Locale
): Promise<CatalogProductRow | null> {
  const col = catalogSlugColumn(locale);
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

export type CatalogPartnerListFilters = {
  district?: string;
  search?: string;
  /** When omitted, returns approved + disabled (excludes legacy pending_review). */
  status?: 'approved' | 'disabled' | 'all';
};

export async function listCatalogPartnersForAdmin(
  filters: CatalogPartnerListFilters = {}
): Promise<CatalogPartnerRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.status && filters.status !== 'all') {
    conditions.push(`status = $${i++}`);
    params.push(filters.status);
  } else {
    conditions.push(`status IN ('approved', 'disabled')`);
  }

  if (filters.district) {
    conditions.push(`district = $${i++}`);
    params.push(filters.district);
  }

  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(
      `(shop_name ILIKE $${i} OR shop_address ILIKE $${i} OR contact_name ILIKE $${i})`
    );
    params.push(q);
    i += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return queryRows<CatalogPartnerRow>(
    `SELECT * FROM catalog_partners
     ${where}
     ORDER BY
       CASE WHEN status = 'approved' THEN 0 ELSE 1 END,
       shop_name ASC`,
    params
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
