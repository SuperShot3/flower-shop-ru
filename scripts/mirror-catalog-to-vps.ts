/**
 * One-time export: mirror bouquet catalog images from Thailand Supabase Storage
 * → local folder (and optionally Vercel Blob for Russia production).
 *
 * Run locally only with `.env.export.local` — NEVER deploy export credentials to Vercel.
 *
 * Usage:
 *   npm run mirror-catalog
 *   npm run mirror-catalog:dry-run
 *   npm run mirror-catalog -- --upload-blob
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
const UPLOAD_BLOB = process.argv.includes('--upload-blob');
const SKIP_BLOB = process.argv.includes('--skip-blob');
const INCLUDE_PENDING = process.argv.includes('--include-pending');
const CONCURRENCY = 5;

function resolveBlobAccess(): 'public' | 'private' {
  const raw = process.env.BLOB_UPLOAD_ACCESS?.trim().toLowerCase();
  if (raw === 'private' || raw === 'public') return raw;
  return 'public';
}

function guessContentType(storagePath: string): string {
  const lower = storagePath.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

async function uploadBufferToVercelBlob(
  storagePath: string,
  buffer: Buffer,
  token: string,
  access: 'public' | 'private'
): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blobPath = `catalog/${normalizeStoragePath(storagePath)}`;
  const result = await put(blobPath, buffer, {
    access,
    token,
    contentType: guessContentType(storagePath),
    addRandomSuffix: false,
  });
  return result.url;
}

async function main() {
  const supabaseUrl = requireExportEnv('SUPABASE_EXPORT_URL');
  const outputDir = process.env.MIRROR_OUTPUT_DIR?.trim() || path.join(process.cwd(), 'data', 'catalog');
  const publicBase =
    process.env.MIRROR_PUBLIC_BASE_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.ekb-flowers.ru'}/catalog`;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const blobAccess = resolveBlobAccess();
  const shouldUploadBlob = !SKIP_BLOB && (UPLOAD_BLOB || Boolean(blobToken));

  if (UPLOAD_BLOB && !blobToken) {
    throw new Error('--upload-blob requires BLOB_READ_WRITE_TOKEN in .env.local or .env.export.local');
  }

  console.log('[mirror-catalog] Thailand Supabase (read-only):', supabaseUrl);
  console.log('[mirror-catalog] Output dir:', outputDir);
  console.log('[mirror-catalog] Public base URL:', publicBase);
  console.log('[mirror-catalog] Upload to Vercel Blob:', shouldUploadBlob);
  if (shouldUploadBlob) {
    console.log('[mirror-catalog] Blob access mode:', blobAccess);
    if (blobAccess === 'private') {
      console.warn(
        '[mirror-catalog] Warning: private Blob URLs are not directly usable in catalog <img> tags.',
        'For storefront images, create a Public Blob store in Vercel (access cannot be changed after creation).'
      );
    }
  }
  if (SKIP_BLOB) {
    console.log('[mirror-catalog] Blob upload skipped (--skip-blob). Manifest will use MIRROR_PUBLIC_BASE_URL paths.');
  }
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
    uploadTarget: shouldUploadBlob ? 'vercel-blob' : 'local',
    stats: {
      bouquets: bouquets.length,
      partners: partners.length,
      imagePaths: storagePaths.length,
      downloaded: 0,
      skippedExisting: 0,
      uploadedToBlob: 0,
      failed: 0,
      blobFailed: 0,
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
      let buffer: Buffer;

      if (localExists) {
        buffer = fs.readFileSync(localPath);
        manifest.stats.skippedExisting += 1;
        mapping.skipped = true;
      } else {
        const { data, error } = await supabase.storage.from(CATALOG_BUCKET).download(rel);
        if (error || !data) {
          throw new Error(error?.message ?? 'empty download');
        }
        const arrayBuffer = await data.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, buffer);
        manifest.stats.downloaded += 1;
      }

      if (shouldUploadBlob && blobToken) {
        try {
          const blobUrl = await uploadBufferToVercelBlob(rel, buffer, blobToken, blobAccess);
          mapping.blobUrl = blobUrl;
          mapping.publicUrl = blobUrl;
          manifest.stats.uploadedToBlob += 1;
        } catch (blobErr) {
          manifest.stats.blobFailed += 1;
          mapping.error = blobErr instanceof Error ? blobErr.message : String(blobErr);
          console.error('[mirror-catalog] Blob upload failed:', rel, mapping.error);
        }
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
  if (shouldUploadBlob) {
    console.log('[mirror-catalog] Uploaded to Vercel Blob:', manifest.stats.uploadedToBlob);
    if (manifest.stats.blobFailed > 0) {
      console.log('[mirror-catalog] Blob upload failed:', manifest.stats.blobFailed);
    }
  }
  console.log('[mirror-catalog] Download failed:', manifest.stats.failed);

  if (manifest.stats.failed > 0) {
    process.exitCode = 1;
  } else if (manifest.stats.blobFailed > 0) {
    console.warn(
      '[mirror-catalog] Local mirror OK, but Blob upload failed.',
      'Create a Public Blob store in Vercel, update BLOB_READ_WRITE_TOKEN, set BLOB_UPLOAD_ACCESS=public, re-run.',
      'Or run with --skip-blob and import DB rows only (images need Blob or VPS for production).'
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
