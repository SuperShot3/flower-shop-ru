/**
 * One-time import: bouquet catalog rows from Thailand Supabase → Russia Postgres.
 *
 * Run locally with `.env.export.local` + `POSTGRES_URL` (Russia Supabase).
 * Requires `npm run mirror-catalog` first (manifest rewrites image URLs).
 *
 * Usage:
 *   npm run import-catalog-pg
 *   npm run import-catalog-pg:dry-run
 *   npm run import-catalog-pg -- --include-pending
 *   npm run import-catalog-pg -- --replace   # delete existing bouquet catalog first
 */
import { Pool, type PoolClient } from 'pg';

import {
  MANIFEST_PATH,
  createThailandSupabaseClient,
  fetchThailandBouquetImageRows,
  fetchThailandBouquetSlugRows,
  fetchThailandBouquets,
  fetchThailandPartnersByIds,
  loadExportEnv,
  productKindFromBouquetRow,
  readManifest,
  requireExportEnv,
  rewriteStoredImage,
  rewriteStoredImages,
  type ThailandBouquetRow,
  type ThailandPartnerRow,
  type ThailandProductImageRow,
} from './lib/catalog-export-shared';

loadExportEnv();

const DRY_RUN = process.argv.includes('--dry-run');
const INCLUDE_PENDING = process.argv.includes('--include-pending');
const REPLACE = process.argv.includes('--replace');

const RUSSIA_PARTNER_CITY = 'Yekaterinburg';

const BOUQUET_COLUMNS = [
  'id',
  'legacy_sanity_id',
  'partner_id',
  'slug_en',
  'slug_th',
  'name_en',
  'name_th',
  'description_en',
  'description_th',
  'composition_en',
  'composition_th',
  'product_kind',
  'pricing',
  'status',
  'featured_popular',
  'discount_percent',
  'delivery_options',
  'excluded_delivery_destinations',
  'presentation_formats',
  'colors',
  'flower_types',
  'occasion',
  'images',
  'source',
  'created_by',
  'approved_by',
  'approved_at',
  'created_at',
  'updated_at',
] as const;

const PARTNER_COLUMNS = [
  'id',
  'legacy_sanity_id',
  'shop_name',
  'contact_name',
  'phone_number',
  'line_or_whatsapp',
  'shop_address',
  'shop_bio_en',
  'shop_bio_th',
  'portrait',
  'city',
  'status',
  'supabase_user_id',
  'created_at',
  'updated_at',
] as const;

const IMAGE_COLUMNS = [
  'id',
  'entity_type',
  'entity_id',
  'revision_id',
  'storage_path',
  'public_url',
  'alt_en',
  'alt_th',
  'metadata',
  'is_primary',
  'sort_order',
  'source_type',
  'created_at',
  'updated_at',
  'updated_by',
  'deleted_at',
] as const;

function pickColumns(row: Record<string, unknown>, columns: readonly string[]): unknown[] {
  return columns.map((col) => row[col] ?? null);
}

function mapPartnerRow(row: ThailandPartnerRow, manifest: ReturnType<typeof readManifest>) {
  const portrait = row.portrait ? rewriteStoredImage(row.portrait, manifest) : null;
  return {
    ...row,
    portrait,
    city: RUSSIA_PARTNER_CITY,
    supabase_user_id: null,
  };
}

function mapBouquetRow(row: ThailandBouquetRow, manifest: ReturnType<typeof readManifest>) {
  return {
    ...row,
    product_kind: productKindFromBouquetRow(row),
    images: rewriteStoredImages(row.images, manifest),
    excluded_delivery_destinations: row.excluded_delivery_destinations ?? [],
  };
}

function mapImageRow(row: ThailandProductImageRow, manifest: ReturnType<typeof readManifest>) {
  const storagePath = row.storage_path.trim();
  const mapping = manifest.mappings[storagePath.replace(/^\/+/, '')];
  const publicUrl = mapping?.blobUrl ?? mapping?.publicUrl ?? row.public_url;
  return {
    ...row,
    storage_path: storagePath.replace(/^\/+/, ''),
    public_url: publicUrl,
    source_type: row.source_type ?? 'migrated_from_import',
  };
}

async function upsertRows(
  db: Pool | PoolClient,
  table: string,
  columns: readonly string[],
  rows: Record<string, unknown>[],
  conflictTarget: string
): Promise<number> {
  if (!rows.length) return 0;

  const colList = columns.join(', ');
  const valuePlaceholders = rows
    .map(
      (_, rowIndex) =>
        `(${columns.map((__, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    )
    .join(', ');
  const updates = columns
    .filter((c) => c !== conflictTarget)
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');

  const params = rows.flatMap((row) => pickColumns(row, columns));
  await db.query(
    `INSERT INTO ${table} (${colList})
     VALUES ${valuePlaceholders}
     ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates}`,
    params
  );
  return rows.length;
}

async function main() {
  requireExportEnv('SUPABASE_EXPORT_URL');
  requireExportEnv('SUPABASE_EXPORT_SERVICE_ROLE_KEY');
  const { requireDatabaseUrl } = await import('../lib/db/resolveDatabaseUrl');
  const databaseUrl = requireDatabaseUrl();

  console.log('[import-catalog] Dry run:', DRY_RUN);
  console.log('[import-catalog] Include pending bouquets:', INCLUDE_PENDING);
  console.log('[import-catalog] Replace existing bouquet catalog:', REPLACE);

  const manifest = readManifest(MANIFEST_PATH);
  console.log('[import-catalog] Manifest:', MANIFEST_PATH);
  console.log('[import-catalog] Manifest mappings:', Object.keys(manifest.mappings).length);
  console.log('[import-catalog] Upload target:', manifest.uploadTarget);

  const supabase = await createThailandSupabaseClient();
  const bouquets = await fetchThailandBouquets(supabase, INCLUDE_PENDING);
  const bouquetIds = bouquets.map((b) => b.id);
  const partnerIds = Array.from(
    new Set(bouquets.map((b) => b.partner_id).filter((id): id is string => Boolean(id)))
  );

  const [imageRows, partners, slugRows] = await Promise.all([
    fetchThailandBouquetImageRows(supabase, bouquetIds),
    fetchThailandPartnersByIds(supabase, partnerIds),
    fetchThailandBouquetSlugRows(supabase, bouquetIds),
  ]);

  const mappedPartners = partners.map((p) => mapPartnerRow(p, manifest));
  const mappedBouquets = bouquets.map((b) => mapBouquetRow(b, manifest));
  const mappedImages = imageRows.map((r) => mapImageRow(r, manifest));

  console.log('[import-catalog] Partners to import:', mappedPartners.length);
  console.log('[import-catalog] Bouquets to import:', mappedBouquets.length);
  console.log('[import-catalog] Image rows to import:', mappedImages.length);
  console.log('[import-catalog] Slug registry rows:', slugRows.length);

  const missingMappings = new Set<string>();
  for (const row of mappedImages) {
    const key = row.storage_path.replace(/^\/+/, '');
    if (!manifest.mappings[key]?.publicUrl && !manifest.mappings[key]?.blobUrl) {
      missingMappings.add(key);
    }
  }
  if (missingMappings.size) {
    console.warn(
      `[import-catalog] Warning: ${missingMappings.size} image path(s) missing from manifest (URLs may be stale).`
    );
  }

  if (DRY_RUN) {
    console.log('[import-catalog] Sample bouquets:');
    for (const b of mappedBouquets.slice(0, 5)) {
      console.log(`  - ${b.slug_en} (${b.name_en})`);
    }
    console.log('[import-catalog] Dry run complete.');
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 3,
    connectionTimeoutMillis: 15_000,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (REPLACE) {
      console.log('[import-catalog] Clearing existing bouquet catalog rows…');
      await client.query(`DELETE FROM catalog_product_images WHERE entity_type = 'bouquet'`);
      await client.query(`DELETE FROM catalog_slug_registry WHERE entity_type = 'bouquet'`);
      await client.query(`DELETE FROM catalog_bouquets`);
      const orphanPartners = await client.query<{ id: string }>(
        `SELECT id FROM catalog_partners p
         WHERE NOT EXISTS (SELECT 1 FROM catalog_bouquets b WHERE b.partner_id = p.id)
           AND NOT EXISTS (SELECT 1 FROM catalog_products pr WHERE pr.partner_id = p.id)`
      );
      if (orphanPartners.rowCount) {
        await client.query(
          `DELETE FROM catalog_partners WHERE id = ANY($1::uuid[])`,
          [orphanPartners.rows.map((r) => r.id)]
        );
      }
    }

    await upsertRows(client, 'catalog_partners', PARTNER_COLUMNS, mappedPartners, 'id');
    await upsertRows(client, 'catalog_bouquets', BOUQUET_COLUMNS, mappedBouquets, 'id');
    await upsertRows(client, 'catalog_product_images', IMAGE_COLUMNS, mappedImages, 'id');

    for (const slugRow of slugRows) {
      await client.query(
        `INSERT INTO catalog_slug_registry (id, slug, locale, entity_type, entity_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug, locale) DO UPDATE SET
           entity_type = EXCLUDED.entity_type,
           entity_id = EXCLUDED.entity_id`,
        [
          slugRow.id,
          slugRow.slug,
          slugRow.locale,
          slugRow.entity_type,
          slugRow.entity_id,
          slugRow.created_at,
        ]
      );
    }

    await client.query('COMMIT');
    console.log('[import-catalog] Import complete.');
    console.log('[import-catalog] Next: npm run dev — verify bouquets on the storefront.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
