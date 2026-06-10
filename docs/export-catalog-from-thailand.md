# Export bouquet catalog from Lanna Bloom (Thailand) → EKB Flowers (Russia)

One-time migration: copy **flower bouquets only** (images + Postgres rows) from Thailand Supabase into the Russia project. Toys, balloons, candy, and other `catalog_products` categories are **not** exported.

**Isolation:** Thailand credentials live in `.env.export.local` on your Mac only. Never add `SUPABASE_EXPORT_*` to Vercel or `.env.local` on production.

---

## What gets exported

| Source (Thailand) | Target (Russia) |
|-------------------|-----------------|
| `catalog_bouquets` (approved) | Same table, `product_kind` mapped from `pricing_type` |
| `catalog_partners` (referenced by bouquets) | Same IDs, `city` set to Yekaterinburg, `supabase_user_id` cleared |
| `catalog_product_images` (`entity_type = 'bouquet'`) | Same IDs, `public_url` rewritten |
| `catalog_slug_registry` (bouquet slugs) | Same rows |
| Storage bucket `catalog` (bouquet + partner portrait paths) | Local `data/catalog/` + optional Vercel Blob |

**Skipped:** `catalog_products` (plushy toys, balloons, gifts, food_sweets, etc.)

---

## Prerequisites

1. **Russia Supabase** project connected to Vercel with `DATABASE_URL` in `.env.local`.
2. **Schema applied** on Russia Postgres (Supabase SQL editor or psql):

   ```bash
   # Paste contents of db/migrations/001_catalog_schema.sql
   # Then if needed: db/migrations/002_partner_city_yekaterinburg.sql
   ```

3. **Vercel Blob** store created for the **Russia** Vercel project. Copy `BLOB_READ_WRITE_TOKEN` into `.env.local` (recommended for production image URLs).
4. **Thailand service role key** — read-only use from your Mac. Get it from the Lanna Bloom Supabase project → Settings → API.

---

## Step 1 — Create `.env.export.local`

In the repo root (gitignored):

```bash
cp .env.example .env.export.local
```

Edit `.env.export.local`:

```env
# Thailand Lanna Bloom — READ ONLY
SUPABASE_EXPORT_URL=https://kwbffyojrdjlehdhpptf.supabase.co
SUPABASE_EXPORT_SERVICE_ROLE_KEY=<thailand-service-role-key>

# Local mirror folder
MIRROR_OUTPUT_DIR=./data/catalog
MIRROR_PUBLIC_BASE_URL=https://www.ekb-flowers.ru/catalog

# Russia DB (same value as .env.local DATABASE_URL)
DATABASE_URL=postgres://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# Optional: upload mirrored files to Russia Vercel Blob during mirror step
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Also ensure `.env.local` has:

```env
NEXT_PUBLIC_APP_URL=https://www.ekb-flowers.ru
DATABASE_URL=<same russia pooled url>
BLOB_READ_WRITE_TOKEN=<russia blob token>
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
| `--upload-blob` | Force Vercel Blob upload (requires `BLOB_READ_WRITE_TOKEN`) |

---

## Step 3 — Download images (+ upload to Vercel Blob)

```bash
npm run mirror-catalog
```

If `BLOB_READ_WRITE_TOKEN` is set (in `.env.local` or `.env.export.local`), files are also uploaded to the **Russia** Vercel Blob store. Blob URLs are written into `data/catalog-mirror-manifest.json`.

What happens:

1. Reads approved bouquets from Thailand Supabase.
2. Collects storage paths from `catalog_bouquets.images`, `catalog_product_images`, and partner portraits.
3. Downloads each file from the `catalog` bucket → `data/catalog/`.
4. Optionally uploads to Vercel Blob (`catalog/<path>`).
5. Writes `data/catalog-mirror-manifest.json` (path → public URL mapping).

Re-running is safe: existing local files are skipped; manifest is regenerated.

---

## Step 4 — Dry-run: preview DB import

```bash
npm run import-catalog-pg:dry-run
```

Shows partner/bouquet/image row counts and sample bouquet slugs.

---

## Step 5 — Import rows into Russia Postgres

```bash
npm run import-catalog-pg
```

Uses `DATABASE_URL` + manifest to:

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

## Step 6 — Verify locally

```bash
npm run dev
```

Open [http://localhost:3000/en/catalog](http://localhost:3000/en/catalog) and spot-check:

- Bouquet cards show images (Blob URLs or `/catalog/` paths).
- PDP galleries load.
- Partner names appear where expected.

---

## Step 7 — Deploy (optional)

If you imported with Blob URLs, production already has images. Push code and ensure Vercel env has `DATABASE_URL` + `BLOB_READ_WRITE_TOKEN` (Russia project only).

If you mirrored locally **without** Blob upload, production will not serve `data/catalog/` — run mirror again with `BLOB_READ_WRITE_TOKEN` set, then re-run import to refresh URLs.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing SUPABASE_EXPORT_URL` | Create `.env.export.local` (Step 1) |
| `Manifest not found` | Run `npm run mirror-catalog` first |
| `validateRussiaEnv` blocks startup | Remove any `SUPABASE_*` from `.env.local` — export vars belong in `.env.export.local` only |
| Download 404 / object not found | Path may be stale; check Thailand Storage bucket `catalog` in Supabase dashboard |
| Import connection timeout on `:6543` | Use direct Postgres URL (port `5432`) in `DATABASE_URL` for the import script |
| Images broken on site | Re-run mirror with `BLOB_READ_WRITE_TOKEN`, then `npm run import-catalog-pg` |
| Duplicate slugs on re-import | Use `--replace` for a clean bouquet catalog, or delete conflicting rows in Supabase SQL editor |

---

## Scripts reference

| npm script | File | Purpose |
|------------|------|---------|
| `mirror-catalog` | `scripts/mirror-catalog-to-vps.ts` | Download Thailand Storage → local (+ Blob) |
| `mirror-catalog:dry-run` | same | Preview paths only |
| `import-catalog-pg` | `scripts/import-catalog-to-pg.ts` | Insert bouquet rows into Russia Postgres |
| `import-catalog-pg:dry-run` | same | Preview row counts |

Shared helpers: `scripts/lib/catalog-export-shared.ts`

---

## Security checklist

- [ ] `.env.export.local` is gitignored and never committed
- [ ] Thailand service role key is not in Vercel env
- [ ] `BLOB_READ_WRITE_TOKEN` is from the **Russia** Vercel project only
- [ ] `DATABASE_URL` points to **Russia** Supabase, not Thailand
