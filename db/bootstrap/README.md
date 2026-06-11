# Database bootstrap (generated)

**7 files** replace **68** incremental `supabase/migrations/` on a **fresh** Postgres database.

## Apply

```bash
# Supabase (Vercel integration) or local Postgres
export POSTGRES_URL="postgres://..."
npm run db:bootstrap:apply
```

Or paste files in order into Supabase SQL Editor.

## Files (run in order)

- `01_orders_checkout.sql`
- `02_admin_community.sql`
- `03_accounting.sql`
- `04_email_reminders.sql`
- `05_supplier_workflow.sql`
- `06_catalog.sql`
- `07_security_hardening.sql`

## Regenerate

After changing `scripts/db-bootstrap-manifest.ts`:

```bash
npm run db:bootstrap:assemble
```

See [docs/DATABASE_BOOTSTRAP.md](../docs/DATABASE_BOOTSTRAP.md) for full rationale.
