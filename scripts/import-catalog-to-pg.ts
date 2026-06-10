/**
 * One-time import: catalog rows from Thailand Supabase → Postgres on Timeweb VPS.
 *
 * Run locally with `.env.export.local` + `DATABASE_URL` (SSH tunnel to VPS Postgres).
 *
 * Usage:
 *   npm run import-catalog-pg
 *   npm run import-catalog-pg:dry-run
 */
import 'dotenv/config';
import { config } from 'dotenv';

config({ path: '.env.export.local' });

const DRY_RUN = process.argv.includes('--dry-run');

const CATALOG_TABLES = [
  'catalog_partners',
  'catalog_bouquets',
  'catalog_products',
  'catalog_site_settings',
  'catalog_product_images',
  'catalog_slug_registry',
] as const;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main() {
  requireEnv('SUPABASE_EXPORT_URL');
  requireEnv('SUPABASE_EXPORT_SERVICE_ROLE_KEY');
  requireEnv('DATABASE_URL');

  console.log('[import-catalog] Tables:', CATALOG_TABLES.join(', '));
  console.log('[import-catalog] Dry run:', DRY_RUN);
  console.log(
    '[import-catalog] Scaffold — export rows, rewrite image URLs via catalog-mirror-manifest.json'
  );

  if (DRY_RUN) {
    console.log('[import-catalog] Dry run complete.');
    return;
  }

  console.log('[import-catalog] Apply db/migrations/001_catalog_schema.sql on VPS Postgres first.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
