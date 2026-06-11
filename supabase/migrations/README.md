# Supabase incremental migrations (68 files)

These files are the **historical migration chain** from the Thailand storefront. Run in filename order on databases that already track `supabase_migrations.schema_migrations`.

## New empty database (Russia / clone)

Use the curated bootstrap instead:

```bash
npm run db:bootstrap:apply
```

See [docs/DATABASE_BOOTSTRAP.md](../../docs/DATABASE_BOOTSTRAP.md) — **7 files**, **17 skipped** churn migrations, same final schema.

## Adding a schema change

1. Add `YYYYMMDDHHMMSS_description.sql` here (idempotent DDL).
2. Update `scripts/db-bootstrap-manifest.ts` and run `npm run db:bootstrap:assemble`.
3. Commit both the new migration and regenerated `db/bootstrap/*.sql`.

Do **not** delete or rename existing files if any production DB has applied them.
