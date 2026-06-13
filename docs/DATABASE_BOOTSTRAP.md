# Database bootstrap — fresh Postgres in 7 files

For a **new** Supabase Postgres project, use the curated bootstrap instead of running all **68** incremental migrations from `supabase/migrations/`.

| Path | Purpose |
|------|---------|
| `db/bootstrap/0N_*.sql` | **7 generated files** — final schema state (run in order) |
| `supabase/migrations/` | **68 legacy files** — Thailand history; keep for existing DBs |
| `scripts/db-bootstrap-manifest.ts` | Which legacy files compose each bootstrap file |

## Quick start (new Russia Supabase)

```bash
# 1. Generate bootstrap SQL (committed in repo; re-run after manifest changes)
npm run db:bootstrap:assemble

# 2. Apply to empty database
export POSTGRES_URL="postgres://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?sslmode=require"
npm run db:bootstrap:apply

# 3. Seed admin user
npm run seed-admin
```

Alternative: paste `db/bootstrap/01_*.sql` … `07_*.sql` into **Supabase → SQL Editor** in order.

---

## Optimized plan (68 → 7)

| # | Bootstrap file | What it contains |
|---|----------------|------------------|
| 01 | `01_orders_checkout.sql` | orders, order_items, history, checkout_drafts, stripe_events, indexes, token RLS |
| 02 | `02_admin_community.sql` | admin_users, audit_logs, partner_applications, reviews, newsletter, welcome_codes |
| 03 | `03_accounting.sql` | expenses, income, transfers, withdrawals, receipt images, storage buckets |
| 04 | `04_email_reminders.sql` | email templates/outbox/reminders + **final** template HTML seeds |
| 05 | `05_supplier_workflow.sql` | supplier_order_requests + order confirmation columns |
| 06 | `06_catalog.sql` | catalog_* tables, CMS foundation, storage bucket, pricing_type, **RU defaults** |
| 07 | `07_security_hardening.sql` | RLS catch-all, service_role grants, optional app_settings/order_photos |

**50** legacy migrations are included; **18** are skipped (LINE create/drop, email iteration chain, data-only backfills, superseded CHECKs). See `SKIPPED_MIGRATIONS` in `scripts/db-bootstrap-manifest.ts`.

### Skipped on purpose (examples)

- `20250325120000` / `20250325130000` / `20260416130000` — LINE tables created then dropped
- `20260428120000` … `20260430120000` — delivered-email iterations → final in `20260511120000`
- `20260406130000` / `20260417120000` — intermediate expense categories → final in `20260506120000`
- `20250315100000` — old order_status enum → replaced by `20260511153000`

---

## Why we keep 68 files in `supabase/migrations/`

**Do not delete or squash** `supabase/migrations/` if any environment has already applied them.

Supabase records applied migrations in `supabase_migrations.schema_migrations`. Removing or renaming files breaks:

- `supabase db push` on Thailand production
- Any Russia DB that already ran part of the list
- Audit trail of schema evolution

The bootstrap path is for **empty** databases only. Existing DBs continue to apply **new** incremental files at the end of `supabase/migrations/`.

When you add a schema change:

1. Add a new timestamped file under `supabase/migrations/` (required for live DBs).
2. Update `scripts/db-bootstrap-manifest.ts` so fresh installs get the same change.
3. Run `npm run db:bootstrap:assemble` and commit the regenerated `db/bootstrap/*.sql`.

---

## `db/bootstrap/` vs incremental migrations

The bootstrap `06_catalog.sql` is the **authoritative** catalog shape (CMS tables, `pricing_type`, RLS, storage bucket) plus Russia locale/city defaults.

---

## Final schema (34 public tables)

**Orders:** `orders`, `order_items`, `order_status_history`, `checkout_drafts`, `order_notification_sent`, `stripe_events`

**Admin / community:** `admin_users`, `audit_logs`, `partner_applications`, `customer_reviews`, `newsletter_subscribers`, `welcome_codes`

**Accounting:** `expenses`, `expense_receipt_images`, `income_records`, `income_refunds`, `accounting_transfers`, `accounting_withdrawals`

**Email:** `email_templates`, `email_outbox`, `customer_reminders`, `reminder_email_logs`

**Supplier:** `supplier_order_requests`, `supplier_order_request_events`

**Catalog:** `catalog_partners`, `catalog_bouquets`, `catalog_products`, `catalog_site_settings`, `catalog_slug_registry`, `catalog_product_revisions`, `catalog_product_images`, `catalog_collections`, `catalog_collection_items`, `catalog_audit_events`

**Storage buckets (not tables):** `receipts`, `proofs`, `catalog`

**Conditional RLS only:** `app_settings`, `order_photos` (if created manually)
