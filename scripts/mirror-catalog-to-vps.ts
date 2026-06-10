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
  // @vercel/blob types only declare `access: 'public'`; private stores still accept
  // `private` at runtime — used for probe errors in assertBlobStoreCompatible().
  const result = await put(blobPath, buffer, {
    access,
    token,
    contentType: guessContentType(storagePath),
    addRandomSuffix: false,
  } as Parameters<typeof put>[2]);
  return result.url;
}

function resolveBlobStoreId(): string | undefined {
  return (
    process.env.BLOB_STORE_ID?.trim() ||
    process.env.BLOB_RU_STORE_ID?.trim() ||
    undefined
  );
}

function logBlobEnvDiagnostics(shouldUploadBlob: boolean): void {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = resolveBlobStoreId();
  const oidc = process.env.VERCEL_OIDC_TOKEN?.trim();

  if (!shouldUploadBlob) return;

  console.log('[mirror-catalog] Blob auth env:');
  console.log('  BLOB_READ_WRITE_TOKEN:', token ? 'set (vercel_blob_rw_…)' : 'missing');
  console.log('  BLOB_STORE_ID:', process.env.BLOB_STORE_ID?.trim() ? 'set' : 'missing');
  console.log('  BLOB_RU_STORE_ID:', process.env.BLOB_RU_STORE_ID?.trim() ? 'set (custom alias — SDK ignores unless mapped)' : 'missing');
  console.log('  VERCEL_OIDC_TOKEN:', oidc ? 'set' : 'missing');

  if (!token && storeId && !oidc) {
    console.warn(
      '[mirror-catalog] BLOB_RU_STORE_ID / BLOB_STORE_ID alone is not enough for local uploads.',
      'You need BLOB_READ_WRITE_TOKEN (starts with vercel_blob_rw_) from the Blob store settings,',
      'or run: vercel link && vercel env pull  (sets BLOB_STORE_ID + VERCEL_OIDC_TOKEN).'
    );
  }

  if (storeId && !process.env.BLOB_STORE_ID?.trim() && process.env.BLOB_RU_STORE_ID?.trim()) {
    console.warn(
      '[mirror-catalog] Tip: @vercel/blob expects BLOB_STORE_ID on Vercel deploys.',
      'Keep Vercel env name as BLOB_STORE_ID, or duplicate: BLOB_STORE_ID=<same value as BLOB_RU_STORE_ID>.'
    );
  }
}

function isPrivateStorePublicAccessError(message: string): boolean {
  return message.includes('private store') && message.includes('public access');
}

function isPublicStorePrivateAccessError(message: string): boolean {
  return message.includes('public store') && message.includes('private access');
}

/** Fail fast before uploading hundreds of images when token/store access mode mismatch. */
async function assertBlobStoreCompatible(token: string, access: 'public' | 'private'): Promise<void> {
  const probePath = `.mirror-catalog-probe-${Date.now()}.txt`;
  try {
    await uploadBufferToVercelBlob(probePath, Buffer.from('ok'), token, access);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (access === 'public' && isPrivateStorePublicAccessError(message)) {
      throw new Error(
        [
          'Your BLOB_READ_WRITE_TOKEN is for a PRIVATE Vercel Blob store, but catalog images need a PUBLIC store.',
          'Vercel does not allow changing access mode after creation.',
          '',
          'Fix:',
          '  1. Vercel → flower-shop-ru → Storage → Create → Blob → choose Public',
          '  2. Connect the new store to the project',
          '  3. Copy the new BLOB_READ_WRITE_TOKEN into .env.local / .env.export.local',
          '  4. Set BLOB_UPLOAD_ACCESS=public (or remove it — public is default)',
          '  5. Re-run: npm run mirror-catalog',
          '',
          'Workaround (DB only, no production images): npm run mirror-catalog -- --skip-blob',
        ].join('\n')
      );
    }

    if (access === 'private' && isPublicStorePrivateAccessError(message)) {
      throw new Error(
        'Your Blob store is Public but BLOB_UPLOAD_ACCESS=private. Set BLOB_UPLOAD_ACCESS=public or remove it.'
      );
    }

    throw err;
  }
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
  logBlobEnvDiagnostics(shouldUploadBlob);
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

  if (shouldUploadBlob && blobToken && !DRY_RUN) {
    console.log('[mirror-catalog] Probing Vercel Blob store access…');
    await assertBlobStoreCompatible(blobToken, blobAccess);
    console.log('[mirror-catalog] Blob store OK for access:', blobAccess);
  }

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
          manifest.stats.blobFailed = (manifest.stats.blobFailed ?? 0) + 1;
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
    if ((manifest.stats.blobFailed ?? 0) > 0) {
      console.log('[mirror-catalog] Blob upload failed:', manifest.stats.blobFailed);
    }
  }
  console.log('[mirror-catalog] Download failed:', manifest.stats.failed);

  if (manifest.stats.failed > 0) {
    process.exitCode = 1;
  } else if ((manifest.stats.blobFailed ?? 0) > 0) {
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
