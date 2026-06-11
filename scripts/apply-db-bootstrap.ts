#!/usr/bin/env npx tsx
/**
 * Apply db/bootstrap/*.sql in order against POSTGRES_URL or DATABASE_URL.
 */

import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { BOOTSTRAP_GROUPS, BOOTSTRAP_OUTPUT_DIR } from './db-bootstrap-manifest';
import { loadLocalEnv } from './load-local-env';

loadLocalEnv();

function resolveDatabaseUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Set POSTGRES_URL (Supabase) or DATABASE_URL (VPS) before applying bootstrap.');
  }
  return url;
}

function bootstrapFiles(): string[] {
  return BOOTSTRAP_GROUPS.map((g) => path.join(BOOTSTRAP_OUTPUT_DIR, `${g.order}_${g.slug}.sql`));
}

async function main(): Promise<void> {
  const files = bootstrapFiles();
  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing ${file}. Run: npm run db:bootstrap:assemble`);
    }
  }

  const client = new Client({ connectionString: resolveDatabaseUrl() });
  await client.connect();

  try {
    for (const file of files) {
      const sql = fs.readFileSync(file, 'utf8');
      const name = path.basename(file);
      console.log(`Applying ${name}...`);
      await client.query(sql);
      console.log(`  OK`);
    }
    console.log('\nBootstrap complete.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
