/**
 * Curated migration manifest for fresh database bootstrap.
 *
 * Replaces running all 68 incremental supabase/migrations on empty Postgres.
 * Source files stay in supabase/migrations/ (history + Thailand parity).
 *
 * Run: npm run db:bootstrap:assemble  →  db/bootstrap/*.sql
 *      npm run db:bootstrap:apply     →  psql against POSTGRES_URL / DATABASE_URL
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
export const LEGACY_MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');
export const BOOTSTRAP_OUTPUT_DIR = path.join(REPO_ROOT, 'db', 'bootstrap');

/** Migrations omitted from bootstrap — historical churn or no-op on empty DB. */
export const SKIPPED_MIGRATIONS: ReadonlyArray<{ file: string; reason: string }> = [
  { file: '20250218110000_add_payment_method.sql', reason: 'payment_method already in orders_schema_full' },
  { file: '20250228000000_order_items_partner.sql', reason: 'columns in orders_schema_full' },
  { file: '20250313100000_order_payment_status_refactor.sql', reason: 'data remap only' },
  { file: '20250313210000_orders_admin_notified.sql', reason: 'columns in orders_schema_full' },
  { file: '20250315100000_orders_order_status_check.sql', reason: 'superseded by expand_order_status_lifecycle' },
  { file: '20250325120000_line_order_handoff.sql', reason: 'LINE automation removed' },
  { file: '20250325130000_line_agent_payment_notifications.sql', reason: 'LINE automation removed' },
  { file: '20260416130000_remove_deprecated_line_automation.sql', reason: 'drops LINE tables never created in bootstrap' },
  { file: '20260406130000_expenses_category_soft_toys.sql', reason: 'intermediate category CHECK' },
  { file: '20260417120000_expenses_category_greeting_cards.sql', reason: 'intermediate category CHECK' },
  { file: '20260426120000_email_templates_brand_header.sql', reason: 'folded into final email seeds' },
  { file: '20260428120000_refine_order_delivered_email.sql', reason: 'superseded by order_delivered_email_layout' },
  { file: '20260429120000_remove_delivered_product_showcase.sql', reason: 'superseded by order_delivered_email_layout' },
  { file: '20260430120000_delivered_email_links_new_tab.sql', reason: 'superseded by order_delivered_email_layout' },
  { file: '20260503200000_delivery_expense_payment_bank_transfer.sql', reason: 'data migration only' },
  { file: '20260505120000_split_order_delivery_expense.sql', reason: 'data migration only' },
  { file: '20260520120000_revert_driver_platform.sql', reason: 'driver tables never created in repo' },
];

export type BootstrapGroup = {
  order: string;
  slug: string;
  title: string;
  migrations: string[];
  /** Extra SQL appended after legacy files (Russia defaults, etc.) */
  tailSql?: string;
};

export const BOOTSTRAP_GROUPS: BootstrapGroup[] = [
  {
    order: '01',
    slug: 'orders_checkout',
    title: 'Orders, checkout drafts, stripe idempotency, token RLS',
    migrations: [
      '20250314000000_orders_schema_full.sql',
      '20250218000000_add_order_cost_columns.sql',
      '20250220000000_orders_supabase_primary.sql',
      '20250228100000_orders_performance_indexes.sql',
      '20250313000000_ga4_purchase_columns.sql',
      '20250313200000_order_notification_sent.sql',
      '20250315000000_orders_payment_status_check.sql',
      '20250326120000_orders_submission_token.sql',
      '20260410120000_checkout_drafts.sql',
      '20260416120000_orders_delivered_email_sent_at.sql',
      '20260419120000_orders_admin_list_sort.sql',
      '20260420120000_orders_payment_failed_email_sent_at.sql',
      '20260420133000_orders_rls_token_access.sql',
      '20260506120000_orders_phone_country_codes.sql',
      '20260508120000_orders_delivery_destination_zone_postal.sql',
      '20260511153000_expand_order_status_lifecycle.sql',
      '20260520130000_orders_marketing_email_consent.sql',
    ],
  },
  {
    order: '02',
    slug: 'admin_community',
    title: 'Admin users, partner applications, reviews, newsletter',
    migrations: [
      '20250218100000_admin_users_audit_logs.sql',
      '20250227000000_partner_applications.sql',
      '20250227100000_partner_temp_password.sql',
      '20250301000000_customer_reviews.sql',
      '20250302000000_customer_reviews_rating.sql',
      '20250308000000_newsletter_subscribers.sql',
      '20260506130000_welcome_codes.sql',
      '20260508140500_reviews_admin_only.sql',
    ],
  },
  {
    order: '03',
    slug: 'accounting',
    title: 'Expenses, income, transfers, withdrawals, storage buckets',
    migrations: [
      '20260406000000_expenses.sql',
      '20260406010000_income_records.sql',
      '20260406120000_income_processing_fee.sql',
      '20260408001000_accounting_transfers.sql',
      '20260414120000_expense_receipt_images.sql',
      '20260430130000_accounting_transfer_payout_metadata.sql',
      '20260502120000_income_paid_date.sql',
      '20260503120000_expense_bill_tracking.sql',
      '20260504120000_expense_paper_bill_requested.sql',
      '20260505180000_expenses_payment_stripe.sql',
      '20260506120000_expenses_category_balloons.sql',
      '20260507120000_income_refunds.sql',
      '20260610140000_accounting_withdrawals.sql',
    ],
  },
  {
    order: '04',
    slug: 'email_reminders',
    title: 'Email control center with final template seeds',
    migrations: [
      '20260425120000_email_control_center.sql',
      '20260427120000_email_product_showcase.sql',
      '20260501120000_refine_order_received_email.sql',
      '20260506134500_newsletter_welcome_email_template.sql',
      '20260511120000_order_delivered_email_layout.sql',
    ],
  },
  {
    order: '05',
    slug: 'supplier_workflow',
    title: 'Supplier order request links',
    migrations: ['20260512205000_supplier_request_workflow.sql'],
  },
  {
    order: '06',
    slug: 'catalog',
    title: 'Catalog tables, CMS foundation, storage bucket, pricing_type',
    migrations: [
      '20260526120000_catalog_tables.sql',
      '20260526120001_catalog_storage_bucket.sql',
      '20260526123000_catalog_cms_foundation.sql',
      '20260527120000_catalog_pricing_type.sql',
    ],
    tailSql: `-- EKB Flowers (Russia) defaults — not in Thailand incremental history
ALTER TABLE public.catalog_partners
  ALTER COLUMN city SET DEFAULT 'Yekaterinburg';

-- Allow Russian locale slugs when importing RU storefront content
ALTER TABLE public.catalog_slug_registry
  DROP CONSTRAINT IF EXISTS catalog_slug_registry_locale_check;
ALTER TABLE public.catalog_slug_registry
  ADD CONSTRAINT catalog_slug_registry_locale_check
  CHECK (locale IN ('en', 'th', 'ru'));
`,
  },
  {
    order: '07',
    slug: 'security_hardening',
    title: 'RLS catch-all, service_role grants, optional app_settings / order_photos',
    migrations: [
      '20260508123000_rls_private_checkout_drafts_and_email_tables.sql',
      '20260610120000_harden_public_schema_rls.sql',
      '20260610130000_rls_app_settings_order_photos.sql',
    ],
  },
];

/** All legacy files referenced by bootstrap (for validation). */
export function allBootstrapSourceFiles(): string[] {
  return BOOTSTRAP_GROUPS.flatMap((g) => g.migrations);
}
