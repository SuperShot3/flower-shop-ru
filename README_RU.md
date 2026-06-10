# Flower Shop Russia — isolated storefront

This repository is **independent** from [lannabloom.shop](https://lannabloom.shop) (Thailand / Vercel / Supabase).

## Golden rules

- **Never** merge env files or deploy this repo to the Thailand Vercel project.
- **Never** set `SUPABASE_*`, `STRIPE_*`, or `NEXT_PUBLIC_GTM_ID` in runtime — the app refuses to start if they are present.
- **Never** write to Thailand Supabase from this codebase (export scripts are read-only, local-only).

## Production infrastructure (MVP)

**One Timeweb VPS** (Ubuntu 22.04) — no Vercel, no Yandex Cloud:

| Piece | Where |
|-------|--------|
| Next.js app | Docker on VPS |
| PostgreSQL | Docker on same VPS |
| Catalog images | VPS disk (`/var/www/catalog/`), nginx serves `/catalog/*` |
| Analytics | Yandex Metrica (browser counter only — free) |

**Target cost:** ~1 000–1 200 ₽/month (Timeweb Cloud 50: 4 GB RAM, 50 GB SSD).

See [docs/deploy-vps.md](docs/deploy-vps.md) and [`docker-compose.yml`](docker-compose.yml).

## Local development

1. Copy `.env.example` → `.env.local` and fill Russia-only variables.
2. Start Postgres locally (or `docker compose up postgres -d`).
3. Apply catalog schema: `db/migrations/001_catalog_schema.sql`.
4. `npm install && npm run dev`

## One-time migration from Thailand

Run from your Mac only, using `.env.export.local` (gitignored):

- `npm run mirror-catalog` — download catalog images from Thailand Supabase → `data/catalog/`
- `rsync` images to VPS `/var/www/catalog/`
- `npm run import-catalog-pg` — import catalog rows into VPS Postgres

These scripts use `SUPABASE_EXPORT_*` vars — **not** runtime `SUPABASE_*`.

## Deploy

See [docs/deploy-vps.md](docs/deploy-vps.md).
