/**
 * Shared helpers for one-time Thailand → EKB Flowers catalog export scripts.
 * Local use only — reads `.env.export.local`, never deployed to Vercel.
 */
import fs from 'node:fs';
import path from 'node:path';

import { config } from 'dotenv';
import type { SupabaseClient } from '@supabase/supabase-js';

import { isStorefrontCatalogImage } from '../../lib/catalog/storefrontImages';
import type { CatalogStoredImage } from '../../lib/catalog/types';

export const CATALOG_BUCKET = 'catalog';
export const MANIFEST_PATH = path.join(process.cwd(), 'data', 'catalog-mirror-manifest.json');

export type CatalogMirrorMapping = {
  storagePath: string;
  localPath: string;
  publicUrl: string;
  blobUrl?: string;
  skipped?: boolean;
  error?: string;
};

export type CatalogMirrorManifest = {
  generatedAt: string;
  sourceSupabaseUrl: string;
  publicBase: string;
  uploadTarget: 'local' | 'vercel-blob';
  stats: {
    bouquets: number;
    partners: number;
    imagePaths: number;
    downloaded: number;
    skippedExisting: number;
    uploadedToBlob: number;
    failed: number;
    blobFailed?: number;
  };
  mappings: Record<string, CatalogMirrorMapping>;
};

export type ThailandBouquetRow = Record<string, unknown> & {
  id: string;
  slug_en: string;
  name_en: string;
  partner_id: string | null;
  status: string;
  images: CatalogStoredImage[] | null;
  excluded_delivery_destinations?: string[] | null;
  pricing_type?: string | null;
  product_kind?: string | null;
};

export type ThailandPartnerRow = Record<string, unknown> & {
  id: string;
  portrait: CatalogStoredImage | null;
};

export type ThailandProductImageRow = Record<string, unknown> & {
  id: string;
  entity_type: string;
  entity_id: string | null;
  revision_id: string | null;
  storage_path: string;
  public_url: string | null;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
};

export function loadExportEnv(): void {
  config({ path: '.env.local' });
  config({ path: '.env.export.local' });
}

export function requireExportEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} — set it in .env.export.local (and DATABASE_URL in .env.local for import).`);
  }
  return value;
}

export function normalizeStoragePath(raw: string): string {
  return raw.trim().replace(/^\/+/, '');
}

export function pricingTypeToProductKind(pricingType: string | null | undefined): string {
  switch (pricingType) {
    case 'stem_count':
      return 'single_stem_count';
    case 'size_based':
      return 'fixed_bouquet';
    case 'single_price':
      return 'legacy';
    default:
      return 'legacy';
  }
}

export function productKindFromBouquetRow(row: ThailandBouquetRow): string {
  if (row.product_kind && row.product_kind !== 'legacy') {
    return row.product_kind;
  }
  return pricingTypeToProductKind(row.pricing_type);
}

export function collectStoragePathsFromStoredImages(
  images: CatalogStoredImage[] | null | undefined,
  paths: Set<string>
): void {
  for (const img of images ?? []) {
    const storagePath = img.storage_path?.trim();
    if (!storagePath) continue;
    paths.add(normalizeStoragePath(storagePath));
  }
}

export function collectBouquetImagePaths(
  bouquets: ThailandBouquetRow[],
  imageRows: ThailandProductImageRow[],
  partners: ThailandPartnerRow[]
): string[] {
  const paths = new Set<string>();

  for (const bouquet of bouquets) {
    collectStoragePathsFromStoredImages(bouquet.images, paths);
  }

  const bouquetIds = new Set(bouquets.map((b) => b.id));
  for (const row of imageRows) {
    if (row.entity_type !== 'bouquet') continue;
    if (!row.entity_id || !bouquetIds.has(row.entity_id)) continue;
    if (row.revision_id || row.deleted_at) continue;
    paths.add(normalizeStoragePath(row.storage_path));
  }

  for (const partner of partners) {
    const portraitPath = partner.portrait?.storage_path?.trim();
    if (portraitPath) paths.add(normalizeStoragePath(portraitPath));
  }

  return Array.from(paths).sort();
}

export function rewriteStoredImage(
  img: CatalogStoredImage,
  manifest: CatalogMirrorManifest
): CatalogStoredImage {
  const storagePath = normalizeStoragePath(img.storage_path);
  const mapping = manifest.mappings[storagePath];
  const publicUrl = mapping?.blobUrl ?? mapping?.publicUrl ?? img.public_url;
  return {
    ...img,
    storage_path: storagePath,
    ...(publicUrl ? { public_url: publicUrl } : {}),
  };
}

export function rewriteStoredImages(
  images: CatalogStoredImage[] | null | undefined,
  manifest: CatalogMirrorManifest
): CatalogStoredImage[] {
  return (images ?? []).map((img) => rewriteStoredImage(img, manifest));
}

export async function createThailandSupabaseClient(): Promise<SupabaseClient> {
  const supabaseUrl = requireExportEnv('SUPABASE_EXPORT_URL');
  const serviceKey = requireExportEnv('SUPABASE_EXPORT_SERVICE_ROLE_KEY');
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export async function fetchThailandBouquets(
  supabase: SupabaseClient,
  includePending: boolean
): Promise<ThailandBouquetRow[]> {
  const pageSize = 500;
  const rows: ThailandBouquetRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from('catalog_bouquets').select('*');
    if (!includePending) query = query.eq('status', 'approved');
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(`catalog_bouquets fetch failed: ${error.message}`);
    const batch = (data ?? []) as ThailandBouquetRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export async function fetchThailandBouquetImageRows(
  supabase: SupabaseClient,
  bouquetIds: string[]
): Promise<ThailandProductImageRow[]> {
  if (!bouquetIds.length) return [];

  const rows: ThailandProductImageRow[] = [];
  const chunkSize = 100;

  for (let i = 0; i < bouquetIds.length; i += chunkSize) {
    const chunk = bouquetIds.slice(i, i + chunkSize);
    let from = 0;
    const pageSize = 500;

    while (true) {
      const { data, error } = await supabase
        .from('catalog_product_images')
        .select('*')
        .eq('entity_type', 'bouquet')
        .in('entity_id', chunk)
        .is('revision_id', null)
        .is('deleted_at', null)
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`catalog_product_images fetch failed: ${error.message}`);
      const batch = (data ?? []) as ThailandProductImageRow[];
      rows.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
  }

  return rows;
}

export async function fetchThailandPartnersByIds(
  supabase: SupabaseClient,
  partnerIds: string[]
): Promise<ThailandPartnerRow[]> {
  if (!partnerIds.length) return [];

  const rows: ThailandPartnerRow[] = [];
  const chunkSize = 100;

  for (let i = 0; i < partnerIds.length; i += chunkSize) {
    const chunk = partnerIds.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('catalog_partners').select('*').in('id', chunk);
    if (error) throw new Error(`catalog_partners fetch failed: ${error.message}`);
    rows.push(...((data ?? []) as ThailandPartnerRow[]));
  }

  return rows;
}

export async function fetchThailandBouquetSlugRows(
  supabase: SupabaseClient,
  bouquetIds: string[]
): Promise<Record<string, unknown>[]> {
  if (!bouquetIds.length) return [];

  const rows: Record<string, unknown>[] = [];
  const chunkSize = 100;

  for (let i = 0; i < bouquetIds.length; i += chunkSize) {
    const chunk = bouquetIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('catalog_slug_registry')
      .select('*')
      .eq('entity_type', 'bouquet')
      .in('entity_id', chunk);
    if (error) throw new Error(`catalog_slug_registry fetch failed: ${error.message}`);
    rows.push(...((data ?? []) as Record<string, unknown>[]));
  }

  return rows;
}

export function readManifest(manifestPath = MANIFEST_PATH): CatalogMirrorManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath} — run npm run mirror-catalog first.`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CatalogMirrorManifest;
}

export function writeManifest(manifest: CatalogMirrorManifest, manifestPath = MANIFEST_PATH): void {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export function publicUrlForStoragePath(storagePath: string, publicBase: string): string {
  const rel = normalizeStoragePath(storagePath);
  return `${publicBase.replace(/\/$/, '')}/${rel}`;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export function countStorefrontImages(imageRows: ThailandProductImageRow[]): number {
  return imageRows.filter((row) =>
    isStorefrontCatalogImage({ storage_path: row.storage_path, metadata: row.metadata })
  ).length;
}
