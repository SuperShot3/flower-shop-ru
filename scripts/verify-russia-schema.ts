#!/usr/bin/env npx tsx
/**
 * Verify Russia Supabase schema after db/bootstrap apply.
 *
 * Usage:
 *   POSTGRES_URL=postgres://... npm run db:verify-schema
 */
import { Client } from 'pg';

import { loadLocalEnv } from './load-local-env';

loadLocalEnv();

const REQUIRED_TABLES = [
  'admin_users',
  'audit_logs',
  'catalog_partners',
  'catalog_bouquets',
  'catalog_products',
  'catalog_site_settings',
  'catalog_slug_registry',
  'catalog_product_images',
  'catalog_product_revisions',
  'catalog_collections',
  'catalog_collection_items',
  'catalog_audit_events',
  'partner_applications',
  'orders',
  'order_items',
  'order_status_history',
  'checkout_drafts',
  'supplier_order_requests',
  'supplier_order_request_events',
  'expenses',
  'expense_receipt_images',
  'income_records',
  'income_refunds',
  'accounting_transfers',
  'accounting_withdrawals',
  'email_templates',
  'email_outbox',
  'customer_reminders',
  'reminder_email_logs',
  'customer_reviews',
  'newsletter_subscribers',
  'welcome_codes',
  'stripe_events',
  'order_notification_sent',
] as const;

const REQUIRED_BUCKETS = ['catalog', 'receipts', 'proofs'] as const;

function resolveDatabaseUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Set POSTGRES_URL or DATABASE_URL before running schema verification.');
  }
  return url;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString: resolveDatabaseUrl() });
  await client.connect();

  try {
    const { rows: tableRows } = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'`
    );
    const existingTables = new Set(tableRows.map((row) => row.table_name));

    const missingTables = REQUIRED_TABLES.filter((name) => !existingTables.has(name));
    if (missingTables.length) {
      console.error('Missing public tables:');
      for (const name of missingTables) console.error(`  - ${name}`);
      process.exitCode = 1;
    } else {
      console.log(`Tables OK (${REQUIRED_TABLES.length} required).`);
    }

    const { rows: bucketRows } = await client.query<{ id: string }>(
      `SELECT id FROM storage.buckets`
    );
    const existingBuckets = new Set(bucketRows.map((row) => row.id));
    const missingBuckets = REQUIRED_BUCKETS.filter((name) => !existingBuckets.has(name));

    if (missingBuckets.length) {
      console.error('Missing storage buckets:');
      for (const name of missingBuckets) console.error(`  - ${name}`);
      process.exitCode = 1;
    } else {
      console.log(`Storage buckets OK (${REQUIRED_BUCKETS.join(', ')}).`);
    }

    if (process.exitCode === 1) {
      console.error('\nRun: npm run db:bootstrap:apply');
    } else {
      console.log('\nSchema verification passed.');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
