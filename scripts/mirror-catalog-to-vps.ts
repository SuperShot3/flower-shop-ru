/**
 * One-time export: mirror catalog images from Thailand Supabase Storage → local folder
 * (then rsync to VPS `/var/www/catalog/`).
 *
 * Run locally only with `.env.export.local` — NEVER deploy export credentials to VPS.
 *
 * Usage:
 *   npm run mirror-catalog
 *   npm run mirror-catalog:dry-run
 */
import 'dotenv/config';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

config({ path: '.env.export.local' });

const DRY_RUN = process.argv.includes('--dry-run');

function requireExportEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in .env.export.local`);
  }
  return value;
}

async function main() {
  const supabaseUrl = requireExportEnv('SUPABASE_EXPORT_URL');
  const serviceKey = requireExportEnv('SUPABASE_EXPORT_SERVICE_ROLE_KEY');
  const outputDir = process.env.MIRROR_OUTPUT_DIR?.trim() || path.join(process.cwd(), 'data', 'catalog');
  const publicBase =
    process.env.MIRROR_PUBLIC_BASE_URL?.trim() || 'https://yourdomain.ru/catalog';

  console.log('[mirror-catalog] Thailand Supabase (read-only):', supabaseUrl);
  console.log('[mirror-catalog] Output dir:', outputDir);
  console.log('[mirror-catalog] Public base URL for manifest:', publicBase);
  console.log('[mirror-catalog] Dry run:', DRY_RUN);

  const manifestPath = path.join(process.cwd(), 'data', 'catalog-mirror-manifest.json');
  console.log('[mirror-catalog] Manifest:', manifestPath);
  console.log('[mirror-catalog] Scaffold — download objects into output dir, then rsync to VPS.');

  if (!DRY_RUN) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), publicBase, mappings: {} }, null, 2)
    );
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) throw bucketError;

  const catalogBucket = buckets?.find((b) => b.name === 'catalog');
  console.log('[mirror-catalog] Found catalog bucket:', Boolean(catalogBucket));

  console.log('[mirror-catalog] Done (scaffold). Next: rsync data/catalog/ to VPS /var/www/catalog/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
