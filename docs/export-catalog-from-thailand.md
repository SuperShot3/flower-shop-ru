# Export bouquet catalog from Lanna Bloom (Thailand) → EKB Flowers (Russia)

One-time migration: copy **flower bouquets only** (images + Postgres rows) from Thailand Supabase into the Russia project. Toys, balloons, candy, and other `catalog_products` categories are **not** exported.

**Isolation:** Thailand credentials live in `.env.export.local` on your Mac only. Never add `SUPABASE_EXPORT_*` to Vercel or production env.

---

## What gets exported

| Source (Thailand) | Target (Russia) |
|-------------------|-----------------|
| `catalog_bouquets` (approved) | Same table, `product_kind` mapped from `pricing_type` |
| `catalog_partners` (referenced by bouquets) | Same IDs, `city` set to Yekaterinburg, `supabase_user_id` cleared |
| `catalog_product_images` (`entity_type = 'bouquet'`) | Same IDs, `public_url` rewritten |
| `catalog_slug_registry` (bouquet slugs) | Same rows |
| Storage bucket `catalog` (bouquet + partner portrait paths) | Local `data/catalog/` → Russia Supabase Storage `catalog` bucket |

**Skipped:** `catalog_products` (plushy toys, balloons, gifts, food_sweets, etc.)

---

## Prerequisites

1. **Russia Supabase** project connected to Vercel with `POSTGRES_URL` in `.env.local`.
2. **Schema applied** on Russia Postgres — use the **7-file bootstrap** (not all 68 legacy migrations):

   ```bash
   export POSTGRES_URL="postgres://..."   # from .env.local
   npm run db:bootstrap:apply
   npm run db:verify-schema
   ```

   See [DATABASE_BOOTSTRAP.md](DATABASE_BOOTSTRAP.md). Legacy `db/migrations/001_catalog_schema.sql` is catalog-only and outdated.

3. **Russia Supabase Storage** — `catalog` bucket created by bootstrap (`06_catalog.sql`).
4. **Thailand service role key** — read-only use from your Mac. Get it from the Lanna Bloom Supabase project → Settings → API.

---

## Step 1 — Create `.env.export.local`

In the repo root (gitignored):

```bash
cp .env.export.local.template .env.export.local
```

Edit `.env.export.local`:

```env
# Thailand Lanna Bloom — READ ONLY
SUPABASE_EXPORT_URL=https://kwbffyojrdjlehdhpptf.supabase.co
SUPABASE_EXPORT_SERVICE_ROLE_KEY=<thailand-service-role-key>

# Local mirror folder
MIRROR_OUTPUT_DIR=./data/catalog
```

Also ensure `.env.local` has Russia runtime credentials:

```env
NEXT_PUBLIC_APP_URL=https://www.ekb-flowers.ru
POSTGRES_URL=<russia pooled url>
SUPABASE_URL=https://[ru-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=<russia service role>
SUPABASE_ANON_KEY=<russia anon key>
AUTH_SECRET=<random secret>
```

> **Tip:** If pooled port `6543` fails for bulk import, use the direct session URL (port `5432`) from Supabase → Database → Connection string.

---

## Step 2 — Dry-run: preview bouquet count and image paths

```bash
npm run mirror-catalog:dry-run
```

Expected output: bouquet count, partner count, unique storage paths, and a sample of paths.

Optional flags:

| Flag | Effect |
|------|--------|
| `--include-pending` | Include bouquets not yet `approved` |

---

## Step 3 — Download images from Thailand

```bash
npm run mirror-catalog
```

What happens:

1. Reads approved bouquets from Thailand Supabase.
2. Collects storage paths from `catalog_bouquets.images`, `catalog_product_images`, and partner portraits.
3. Downloads each file from the `catalog` bucket → `data/catalog/`.
4. Writes `data/catalog-mirror-manifest.json` (path → placeholder URL mapping).

Re-running is safe: existing local files are skipped; manifest is regenerated.

---

## Step 4 — Upload images to Russia Supabase Storage

```bash
npm run migrate-catalog-storage:dry-run   # preview
npm run migrate-catalog-storage           # upload to catalog bucket
npm run migrate-catalog-storage -- --rewrite-db   # also update Postgres URLs if rows already exist
```

Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Russia project). Updates manifest with Supabase Storage public URLs.

---

## Step 5 — Dry-run: preview DB import

```bash
npm run import-catalog-pg:dry-run
```

Shows partner/bouquet/image row counts and sample bouquet slugs.

---

## Step 6 — Import rows into Russia Postgres

```bash
npm run import-catalog-pg
```

Uses `POSTGRES_URL` + manifest to:

1. Upsert partners (preserve UUIDs, city → Yekaterinburg).
2. Upsert bouquets (`pricing_type` → `product_kind`, images JSONB rewritten).
3. Upsert `catalog_product_images` with new `public_url`.
4. Upsert bouquet slug registry rows.

Flags:

| Flag | Effect |
|------|--------|
| `--include-pending` | Import non-approved bouquets |
| `--replace` | Delete existing bouquet catalog rows first, then import |
| `--dry-run` | Preview only |

Re-running without `--replace` is idempotent (upsert by primary key).

---

## Step 7 — Verify locally

```bash
npm run dev
```

Open [http://localhost:3000/ru/catalog](http://localhost:3000/ru/catalog) and spot-check:

- Bouquet cards show images from Supabase Storage URLs.
- PDP galleries load.
- Partner names appear where expected.

---

## Step 8 — Deploy

Push code and ensure Vercel env has `POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and `AUTH_SECRET`.

Seed admin (once, locally):

```bash
ADMIN_SEED_EMAIL=k.v.polovnikov@gmail.com ADMIN_SEED_PASSWORD=... npm run seed-admin
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing SUPABASE_EXPORT_URL` | Create `.env.export.local` (Step 1) |
| `Manifest not found` | Run `npm run mirror-catalog` first |
| `getSupabaseAdmin()` returns null | Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` / Vercel |
| Download 404 / object not found | Path may be stale; check Thailand Storage bucket `catalog` in Supabase dashboard |
| Import connection timeout on `:6543` | Use direct Postgres URL (port `5432`) in `POSTGRES_URL` for the import script |
| Images broken on site | Run `npm run migrate-catalog-storage`, then re-run import or `--rewrite-db` |
| Duplicate slugs on re-import | Use `--replace` for a clean bouquet catalog, or delete conflicting rows in Supabase SQL editor |

---

## Scripts reference

| npm script | File | Purpose |
|------------|------|---------|
| `mirror-catalog` | `scripts/mirror-catalog-to-vps.ts` | Download Thailand Storage → local |
| `mirror-catalog:dry-run` | same | Preview paths only |
| `migrate-catalog-storage` | `scripts/migrate-catalog-images-to-supabase.ts` | Upload local mirror → Russia Supabase Storage |
| `import-catalog-pg` | `scripts/import-catalog-to-pg.ts` | Insert bouquet rows into Russia Postgres |
| `import-catalog-pg:dry-run` | same | Preview row counts |
| `db:verify-schema` | `scripts/verify-russia-schema.ts` | Check tables + storage buckets after bootstrap |

Shared helpers: `scripts/lib/catalog-export-shared.ts`

---

## Security checklist

- [ ] `.env.export.local` is gitignored and never committed
- [ ] Thailand service role key is not in Vercel env
- [ ] `SUPABASE_URL` / `POSTGRES_URL` point to **Russia** Supabase, not Thailand
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only (Vercel env, never client)
