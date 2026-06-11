#!/usr/bin/env npx tsx
/**
 * Import homepage hero images from local mirror → Russia Postgres `catalog_site_settings`.
 *
 * Expects files under:
 *   data/catalog/site-settings/default/
 *   data/catalog/site-settings/default-carousel/
 *
 * Usage:
 *   npm run import-hero-settings:dry-run
 *   npm run import-hero-settings
 *   npm run import-hero-settings -- --upload   # upload hero files to Storage first
 *
 * Prerequisites:
 *   - Hero files in data/catalog/site-settings/ (you already have these)
 *   - npm run migrate-catalog-storage  (or pass --upload)
 *   - POSTGRES_URL + SUPABASE_URL in .env.local
 *   - Optional: .env.export.local — copies alt text and sort_order from Thailand
 */
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

import type { CatalogStoredImage } from '../lib/catalog/types';
import { normalizeConnectionString, requireNormalizedDatabaseUrl } from '../lib/db/resolveDatabaseUrl';
import { isThailandSupabaseCredential } from '../lib/env/validateRussiaEnv';
import {
  CATALOG_BUCKET,
  MANIFEST_PATH,
  createThailandSupabaseClient,
  loadExportEnv,
  mapWithConcurrency,
  normalizeStoragePath,
  readManifest,
  writeManifest,
  type CatalogMirrorManifest,
  type CatalogMirrorMapping,
} from './lib/catalog-export-shared';
import { loadLocalEnv } from './load-local-env';

loadLocalEnv();
loadExportEnv();

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOAD = process.argv.includes('--upload');
const CONCURRENCY = 5;
const SOURCE_DIR = process.env.MIRROR_OUTPUT_DIR?.trim() || path.join(process.cwd(), 'data', 'catalog');
const HERO_PREFIX = 'site-settings/';

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

function supabasePublicUrl(supabaseUrl: string, storagePath: string): string {
  const rel = normalizeStoragePath(storagePath);
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${CATALOG_BUCKET}/${rel}`;
}

function guessContentType(storagePath: string): string {
  const lower = storagePath.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function guessFormat(storagePath: string): CatalogStoredImage['format'] {
  const lower = storagePath.toLowerCase();
  if (lower.endsWith('.webp')) return 'webp';
  return 'source';
}

function listHeroLocalFiles(): string[] {
  const out: string[] = [];
  for (const sub of ['site-settings/default', 'site-settings/default-carousel']) {
    const dir = path.join(SOURCE_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (!fs.statSync(full).isFile()) continue;
      out.push(normalizeStoragePath(path.join(sub, name)));
    }
  }
  return out.sort();
}

function publicUrlForPath(
  storagePath: string,
  supabaseUrl: string,
  manifest?: CatalogMirrorManifest
): string {
  const rel = normalizeStoragePath(storagePath);
  const mapping = manifest?.mappings[rel];
  return mapping?.storageUrl ?? mapping?.publicUrl ?? supabasePublicUrl(supabaseUrl, rel);
}

type ThailandHeroMeta = {
  heroImage: CatalogStoredImage | null;
  carousel: CatalogStoredImage[];
};

async function fetchThailandHeroMeta(): Promise<ThailandHeroMeta | null> {
  const exportUrl = process.env.SUPABASE_EXPORT_URL?.trim();
  const exportKey = process.env.SUPABASE_EXPORT_SERVICE_ROLE_KEY?.trim();
  if (!exportUrl || !exportKey) return null;

  try {
    const supabase = await createThailandSupabaseClient();
    const { data, error } = await supabase
      .from('catalog_site_settings')
      .select('hero_image, hero_carousel_images')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw error;
    return {
      heroImage: (data?.hero_image as CatalogStoredImage | null) ?? null,
      carousel: (data?.hero_carousel_images as CatalogStoredImage[]) ?? [],
    };
  } catch (err) {
    console.warn('[import-hero-settings] Thailand metadata skipped:', err instanceof Error ? err.message : err);
    return null;
  }
}

function metaByStoragePath(meta: ThailandHeroMeta | null): Map<string, CatalogStoredImage> {
  const map = new Map<string, CatalogStoredImage>();
  if (!meta) return map;
  if (meta.heroImage?.storage_path) {
    map.set(normalizeStoragePath(meta.heroImage.storage_path), meta.heroImage);
  }
  for (const img of meta.carousel) {
    if (img.storage_path) map.set(normalizeStoragePath(img.storage_path), img);
  }
  return map;
}

function buildStoredImage(
  storagePath: string,
  supabaseUrl: string,
  manifest: CatalogMirrorManifest | undefined,
  meta: Map<string, CatalogStoredImage>,
  defaults: { alt: string; sortOrder: number; isPrimary: boolean }
): CatalogStoredImage {
  const rel = normalizeStoragePath(storagePath);
  const fromThailand = meta.get(rel);
  return {
    storage_path: rel,
    public_url: publicUrlForPath(rel, supabaseUrl, manifest),
    alt: fromThailand?.alt?.trim() || defaults.alt,
    format: fromThailand?.format ?? guessFormat(rel),
    is_primary: fromThailand?.is_primary ?? defaults.isPrimary,
    sort_order: fromThailand?.sort_order ?? defaults.sortOrder,
  };
}

function carouselSortOrder(storagePath: string, fallback: number): number {
  const base = path.basename(storagePath);
  const numeric = /^(\d+)\./.exec(base);
  if (numeric) return Number(numeric[1]);
  const timestamp = /^(\d+)\./.exec(base.replace(/\.[^.]+$/, ''));
  if (timestamp) return 1000 + Number(timestamp[1]);
  return 10000 + fallback;
}

function buildHeroSettings(
  localPaths: string[],
  supabaseUrl: string,
  manifest: CatalogMirrorManifest | undefined,
  thailandMeta: ThailandHeroMeta | null
): { heroImage: CatalogStoredImage | null; carousel: CatalogStoredImage[] } {
  const meta = metaByStoragePath(thailandMeta);
  const mainPaths = localPaths.filter((p) => p.startsWith('site-settings/default/'));
  const carouselPaths = localPaths.filter((p) => p.startsWith('site-settings/default-carousel/'));

  const heroPath =
    mainPaths.find((p) => p.endsWith('/0.jpg')) ??
    mainPaths.sort()[0] ??
    null;

  const heroImage = heroPath
    ? buildStoredImage(heroPath, supabaseUrl, manifest, meta, {
        alt: 'Hero',
        sortOrder: 0,
        isPrimary: true,
      })
    : null;

  const carousel = carouselPaths
    .map((storagePath, index) =>
      buildStoredImage(storagePath, supabaseUrl, manifest, meta, {
        alt: 'Hero carousel',
        sortOrder: carouselSortOrder(storagePath, index),
        isPrimary: index === 0,
      })
    )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img, index) => ({ ...img, sort_order: index, is_primary: index === 0 }));

  return { heroImage, carousel };
}

async function uploadHeroFiles(
  supabaseUrl: string,
  serviceKey: string,
  localPaths: string[]
): Promise<CatalogMirrorManifest> {
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const manifest: CatalogMirrorManifest = fs.existsSync(MANIFEST_PATH)
    ? readManifest(MANIFEST_PATH)
    : {
        generatedAt: new Date().toISOString(),
        sourceSupabaseUrl: supabaseUrl,
        publicBase: supabasePublicUrl(supabaseUrl, ''),
        uploadTarget: 'supabase-storage',
        stats: {
          bouquets: 0,
          partners: 0,
          imagePaths: localPaths.length,
          downloaded: 0,
          skippedExisting: 0,
          uploadedToBlob: 0,
          failed: 0,
        },
        mappings: {},
      };

  manifest.uploadTarget = 'supabase-storage';
  manifest.publicBase = supabasePublicUrl(supabaseUrl, '');

  await mapWithConcurrency(localPaths, CONCURRENCY, async (rel) => {
    const localPath = path.join(SOURCE_DIR, rel);
    const mapping: CatalogMirrorMapping = manifest.mappings[rel] ?? {
      storagePath: rel,
      localPath,
      publicUrl: supabasePublicUrl(supabaseUrl, rel),
    };

    const buffer = fs.readFileSync(localPath);
    const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(rel, buffer, {
      contentType: guessContentType(rel),
      upsert: true,
    });
    if (error) throw new Error(`${rel}: ${error.message}`);

    mapping.storageUrl = supabasePublicUrl(supabaseUrl, rel);
    mapping.publicUrl = mapping.storageUrl;
    manifest.mappings[rel] = mapping;
    manifest.stats.uploadedToBlob = (manifest.stats.uploadedToBlob ?? 0) + 1;
  });

  writeManifest(manifest, MANIFEST_PATH);
  return manifest;
}

async function upsertSiteSettings(
  heroImage: CatalogStoredImage | null,
  carousel: CatalogStoredImage[]
): Promise<void> {
  const pool = new Pool({
    connectionString: requireNormalizedDatabaseUrl(),
    max: 2,
    connectionTimeoutMillis: 15_000,
  });

  try {
    await pool.query(
      `INSERT INTO catalog_site_settings (id, hero_image, hero_carousel_images, updated_at)
       VALUES ('default', $1::jsonb, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET
         hero_image = EXCLUDED.hero_image,
         hero_carousel_images = EXCLUDED.hero_carousel_images,
         updated_at = EXCLUDED.updated_at`,
      [
        heroImage ? JSON.stringify(heroImage) : null,
        JSON.stringify(carousel),
      ]
    );
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const supabaseUrl = requireRussiaEnv('SUPABASE_URL');
  const localPaths = listHeroLocalFiles().filter((p) => p.startsWith(HERO_PREFIX));

  console.log('[import-hero-settings] Source dir:', SOURCE_DIR);
  console.log('[import-hero-settings] Hero files found:', localPaths.length);
  console.log('[import-hero-settings] Dry run:', DRY_RUN);
  console.log('[import-hero-settings] Upload first:', UPLOAD);

  if (!localPaths.length) {
    throw new Error(
      'No hero files under data/catalog/site-settings/. Add files to default/ and default-carousel/.'
    );
  }

  let manifest: CatalogMirrorManifest | undefined;
  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = readManifest(MANIFEST_PATH);
    console.log('[import-hero-settings] Manifest mappings:', Object.keys(manifest.mappings).length);
  }

  if (UPLOAD && !DRY_RUN) {
    const serviceKey = requireRussiaEnv('SUPABASE_SERVICE_ROLE_KEY');
    console.log('[import-hero-settings] Uploading hero files to Russia Storage…');
    manifest = await uploadHeroFiles(supabaseUrl, serviceKey, localPaths);
    console.log('[import-hero-settings] Uploaded:', manifest.stats.uploadedToBlob ?? localPaths.length);
  }

  const thailandMeta = await fetchThailandHeroMeta();
  if (thailandMeta) {
    console.log('[import-hero-settings] Using alt/sort metadata from Thailand DB');
  }

  const { heroImage, carousel } = buildHeroSettings(localPaths, supabaseUrl, manifest, thailandMeta);

  console.log('[import-hero-settings] Main hero:', heroImage?.storage_path ?? '(none)');
  console.log('[import-hero-settings] Carousel images:', carousel.length);
  if (DRY_RUN) {
    console.log('[import-hero-settings] Sample carousel URL:', carousel[0]?.public_url);
    console.log('[import-hero-settings] Dry run complete.');
    return;
  }

  await upsertSiteSettings(heroImage, carousel);
  console.log('[import-hero-settings] catalog_site_settings updated.');
  console.log('[import-hero-settings] Next: rm -rf .next/cache && npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
