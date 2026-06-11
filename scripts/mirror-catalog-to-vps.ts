/**
 * One-time export: mirror bouquet catalog images from Thailand Supabase Storage
 * → local folder (`data/catalog/`). Upload to Russia Supabase with:
 *   npm run migrate-catalog-storage
 *
 * Run locally only with `.env.export.local` — NEVER deploy export credentials to Vercel.
 *
 * Usage:
 *   npm run mirror-catalog
 *   npm run mirror-catalog:dry-run
 *   npm run mirror-catalog -- --include-pending
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  CATALOG_BUCKET,
  MANIFEST_PATH,
  type CatalogMirrorManifest,
  type CatalogMirrorMapping,
  collectBouquetImagePaths,
  createThailandSupabaseClient,
  fetchThailandBouquetImageRows,
  fetchThailandBouquets,
  fetchThailandPartnersByIds,
  loadExportEnv,
  mapWithConcurrency,
  normalizeStoragePath,
  publicUrlForStoragePath,
  requireExportEnv,
  writeManifest,
} from './lib/catalog-export-shared';

loadExportEnv();

const DRY_RUN = process.argv.includes('--dry-run');
const INCLUDE_PENDING = process.argv.includes('--include-pending');
const CONCURRENCY = 5;

async function main() {
  const supabaseUrl = requireExportEnv('SUPABASE_EXPORT_URL');
  const outputDir = process.env.MIRROR_OUTPUT_DIR?.trim() || path.join(process.cwd(), 'data', 'catalog');
  const publicBase =
    process.env.MIRROR_PUBLIC_BASE_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.ekb-flowers.ru'}/catalog`;

  console.log('[mirror-catalog] Thailand Supabase (read-only):', supabaseUrl);
  console.log('[mirror-catalog] Output dir:', outputDir);
  console.log('[mirror-catalog] Public base URL (manifest placeholder):', publicBase);
  console.log('[mirror-catalog] Next step after download: npm run migrate-catalog-storage');
  console.log('[mirror-catalog] Include pending bouquets:', INCLUDE_PENDING);
  console.log('[mirror-catalog] Dry run:', DRY_RUN);

  const supabase = await createThailandSupabaseClient();

  const bouquets = await fetchThailandBouquets(supabase, INCLUDE_PENDING);
  const bouquetIds = bouquets.map((b) => b.id);
  const partnerIds = Array.from(
    new Set(bouquets.map((b) => b.partner_id).filter((id): id is string => Boolean(id)))
  );

  const [imageRows, partners] = await Promise.all([
    fetchThailandBouquetImageRows(supabase, bouquetIds),
    fetchThailandPartnersByIds(supabase, partnerIds),
  ]);

  const storagePaths = collectBouquetImagePaths(bouquets, imageRows, partners);

  console.log('[mirror-catalog] Bouquets:', bouquets.length);
  console.log('[mirror-catalog] Partners:', partners.length);
  console.log('[mirror-catalog] Image rows (live):', imageRows.length);
  console.log('[mirror-catalog] Unique storage paths:', storagePaths.length);

  if (DRY_RUN) {
    console.log('[mirror-catalog] Sample paths:');
    for (const p of storagePaths.slice(0, 10)) {
      console.log('  -', p);
    }
    if (storagePaths.length > 10) {
      console.log(`  ... and ${storagePaths.length - 10} more`);
    }
    console.log('[mirror-catalog] Dry run complete.');
    return;
  }

  if (!storagePaths.length) {
    console.log('[mirror-catalog] Nothing to download.');
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const manifest: CatalogMirrorManifest = {
    generatedAt: new Date().toISOString(),
    sourceSupabaseUrl: supabaseUrl,
    publicBase,
    uploadTarget: 'local',
    stats: {
      bouquets: bouquets.length,
      partners: partners.length,
      imagePaths: storagePaths.length,
      downloaded: 0,
      skippedExisting: 0,
      uploadedToBlob: 0,
      failed: 0,
    },
    mappings: {},
  };

  await mapWithConcurrency(storagePaths, CONCURRENCY, async (storagePath) => {
    const rel = normalizeStoragePath(storagePath);
    const localPath = path.join(outputDir, rel);
    const mapping: CatalogMirrorMapping = {
      storagePath: rel,
      localPath,
      publicUrl: publicUrlForStoragePath(rel, publicBase),
    };

    try {
      const localExists = fs.existsSync(localPath);
      if (localExists) {
        manifest.stats.skippedExisting += 1;
        mapping.skipped = true;
      } else {
        const { data, error } = await supabase.storage.from(CATALOG_BUCKET).download(rel);
        if (error || !data) {
          throw new Error(error?.message ?? 'empty download');
        }
        const arrayBuffer = await data.arrayBuffer();
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
        manifest.stats.downloaded += 1;
      }
    } catch (err) {
      manifest.stats.failed += 1;
      mapping.error = err instanceof Error ? err.message : String(err);
      console.error('[mirror-catalog] Failed:', rel, mapping.error);
    }

    manifest.mappings[rel] = mapping;
  });

  writeManifest(manifest, MANIFEST_PATH);

  console.log('[mirror-catalog] Manifest:', MANIFEST_PATH);
  console.log('[mirror-catalog] Downloaded:', manifest.stats.downloaded);
  console.log('[mirror-catalog] Skipped (already local):', manifest.stats.skippedExisting);
  console.log('[mirror-catalog] Download failed:', manifest.stats.failed);
  console.log('[mirror-catalog] Upload to Russia: npm run migrate-catalog-storage');

  if (manifest.stats.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
