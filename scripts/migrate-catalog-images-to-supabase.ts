#!/usr/bin/env npx tsx
/**
 * Upload local catalog mirror (data/catalog/) → Russia Supabase Storage `catalog` bucket.
 * Optionally rewrite image public_url values in Postgres.
 *
 * Prerequisites:
 *   - npm run mirror-catalog (Thailand export → data/catalog/)
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local (Russia project)
 *
 * Usage:
 *   npm run migrate-catalog-storage
 *   npm run migrate-catalog-storage:dry-run
 *   npm run migrate-catalog-storage -- --rewrite-db
 */
import fs from 'node:fs';
import path from 'node:path';

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

import { normalizeConnectionString } from '../lib/db/resolveDatabaseUrl';
import { isThailandSupabaseCredential } from '../lib/env/validateRussiaEnv';
import {
  CATALOG_BUCKET,
  MANIFEST_PATH,
  mapWithConcurrency,
  normalizeStoragePath,
  readManifest,
  writeManifest,
  type CatalogMirrorManifest,
  type CatalogMirrorMapping,
} from './lib/catalog-export-shared';

config({ path: '.env.local' });
config({ path: '.env.export.local' });

const DRY_RUN = process.argv.includes('--dry-run');
const REWRITE_DB = process.argv.includes('--rewrite-db');
const CONCURRENCY = 5;
const SOURCE_DIR = process.env.MIRROR_OUTPUT_DIR?.trim() || path.join(process.cwd(), 'data', 'catalog');

function requireRussiaEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} — set Russia Supabase credentials in .env.local.`);
  }
  if (isThailandSupabaseCredential(value)) {
    throw new Error(`${name} points at Thailand Supabase — use Russia project credentials only.`);
  }
  return value;
}

function resolveDatabaseUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Set POSTGRES_URL (Russia Supabase) for --rewrite-db or manifest updates.');
  }
  if (isThailandSupabaseCredential(url)) {
    throw new Error('POSTGRES_URL points at Thailand Supabase.');
  }
  return normalizeConnectionString(url);
}

function supabasePublicUrl(supabaseUrl: string, storagePath: string): string {
  const rel = normalizeStoragePath(storagePath);
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${CATALOG_BUCKET}/${rel}`;
}

function guessContentType(storagePath: string): string {
  const lower = storagePath.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

function walkLocalFiles(dir: string, root = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkLocalFiles(full, root));
    } else if (entry.isFile()) {
      out.push(normalizeStoragePath(path.relative(root, full)));
    }
  }
  return out.sort();
}

function loadOrCreateManifest(supabaseUrl: string): CatalogMirrorManifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    return readManifest(MANIFEST_PATH);
  }
  return {
    generatedAt: new Date().toISOString(),
    sourceSupabaseUrl: supabaseUrl,
    publicBase: supabasePublicUrl(supabaseUrl, ''),
    uploadTarget: 'supabase-storage',
    stats: {
      bouquets: 0,
      partners: 0,
      imagePaths: 0,
      downloaded: 0,
      skippedExisting: 0,
      uploadedToBlob: 0,
      failed: 0,
    },
    mappings: {},
  };
}

async function rewriteDatabaseUrls(supabaseUrl: string, manifest: CatalogMirrorManifest): Promise<void> {
  const pool = new Pool({ connectionString: resolveDatabaseUrl() });
  const client = await pool.connect();

  try {
    const { rows: bouquets } = await client.query<{ id: string; images: unknown }>(
      `SELECT id, images FROM catalog_bouquets WHERE images IS NOT NULL`
    );

    let bouquetUpdates = 0;
    for (const row of bouquets) {
      const images = Array.isArray(row.images) ? row.images : [];
      let changed = false;
      const next = images.map((img) => {
        if (!img || typeof img !== 'object') return img;
        const storagePath = normalizeStoragePath(String((img as { storage_path?: string }).storage_path ?? ''));
        if (!storagePath) return img;
        const mapping = manifest.mappings[storagePath];
        const publicUrl = mapping?.storageUrl ?? mapping?.publicUrl;
        if (!publicUrl) return img;
        changed = true;
        return { ...(img as Record<string, unknown>), storage_path: storagePath, public_url: publicUrl };
      });
      if (changed) {
        await client.query(`UPDATE catalog_bouquets SET images = $2::jsonb WHERE id = $1`, [
          row.id,
          JSON.stringify(next),
        ]);
        bouquetUpdates += 1;
      }
    }

    const { rows: partners } = await client.query<{ id: string; portrait: unknown }>(
      `SELECT id, portrait FROM catalog_partners WHERE portrait IS NOT NULL`
    );

    let partnerUpdates = 0;
    for (const row of partners) {
      if (!row.portrait || typeof row.portrait !== 'object') continue;
      const storagePath = normalizeStoragePath(
        String((row.portrait as { storage_path?: string }).storage_path ?? '')
      );
      if (!storagePath) continue;
      const mapping = manifest.mappings[storagePath];
      const publicUrl = mapping?.storageUrl ?? mapping?.publicUrl;
      if (!publicUrl) continue;
      await client.query(`UPDATE catalog_partners SET portrait = $2::jsonb WHERE id = $1`, [
        row.id,
        JSON.stringify({ ...(row.portrait as Record<string, unknown>), storage_path: storagePath, public_url: publicUrl }),
      ]);
      partnerUpdates += 1;
    }

    let imageRowUpdates = 0;
    for (const mapping of Object.values(manifest.mappings)) {
      const publicUrl = mapping.storageUrl ?? mapping.publicUrl;
      if (!publicUrl) continue;
      const result = await client.query(
        `UPDATE catalog_product_images
         SET public_url = $2
         WHERE storage_path = $1
           AND (public_url IS DISTINCT FROM $2)`,
        [mapping.storagePath, publicUrl]
      );
      imageRowUpdates += result.rowCount ?? 0;
    }

    console.log('[migrate-catalog-storage] DB rewrites:');
    console.log('  catalog_bouquets:', bouquetUpdates);
    console.log('  catalog_partners:', partnerUpdates);
    console.log('  catalog_product_images rows:', imageRowUpdates);
  } finally {
    client.release();
    await pool.end();
  }
}

async function main(): Promise<void> {
  const supabaseUrl = requireRussiaEnv('SUPABASE_URL');
  const serviceKey = requireRussiaEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const storagePaths = walkLocalFiles(SOURCE_DIR);
  console.log('[migrate-catalog-storage] Source dir:', SOURCE_DIR);
  console.log('[migrate-catalog-storage] Russia Supabase:', supabaseUrl);
  console.log('[migrate-catalog-storage] Files to upload:', storagePaths.length);
  console.log('[migrate-catalog-storage] Dry run:', DRY_RUN);
  console.log('[migrate-catalog-storage] Rewrite DB:', REWRITE_DB);

  if (!storagePaths.length) {
    console.error('No files in data/catalog/. Run: npm run mirror-catalog');
    process.exit(1);
  }

  if (DRY_RUN) {
    for (const rel of storagePaths.slice(0, 10)) {
      console.log('  -', rel, '→', supabasePublicUrl(supabaseUrl, rel));
    }
    if (storagePaths.length > 10) {
      console.log(`  ... and ${storagePaths.length - 10} more`);
    }
    return;
  }

  const manifest = loadOrCreateManifest(supabaseUrl);
  manifest.uploadTarget = 'supabase-storage';
  manifest.publicBase = supabasePublicUrl(supabaseUrl, '');
  manifest.stats.imagePaths = storagePaths.length;

  await mapWithConcurrency(storagePaths, CONCURRENCY, async (rel) => {
    const localPath = path.join(SOURCE_DIR, rel);
    const mapping: CatalogMirrorMapping = manifest.mappings[rel] ?? {
      storagePath: rel,
      localPath,
      publicUrl: supabasePublicUrl(supabaseUrl, rel),
    };

    try {
      const buffer = fs.readFileSync(localPath);
      const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(rel, buffer, {
        contentType: guessContentType(rel),
        upsert: true,
      });
      if (error) throw new Error(error.message);

      mapping.storageUrl = supabasePublicUrl(supabaseUrl, rel);
      mapping.publicUrl = mapping.storageUrl;
      manifest.stats.uploadedToBlob = (manifest.stats.uploadedToBlob ?? 0) + 1;
    } catch (err) {
      manifest.stats.failed += 1;
      mapping.error = err instanceof Error ? err.message : String(err);
      console.error('[migrate-catalog-storage] Failed:', rel, mapping.error);
    }

    manifest.mappings[rel] = mapping;
  });

  writeManifest(manifest, MANIFEST_PATH);
  console.log('[migrate-catalog-storage] Manifest:', MANIFEST_PATH);
  console.log('[migrate-catalog-storage] Uploaded:', manifest.stats.uploadedToBlob ?? 0);
  console.log('[migrate-catalog-storage] Failed:', manifest.stats.failed);

  if (REWRITE_DB) {
    await rewriteDatabaseUrls(supabaseUrl, manifest);
  } else {
    console.log('[migrate-catalog-storage] Tip: re-run with --rewrite-db to update Postgres image URLs.');
  }

  if (manifest.stats.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
