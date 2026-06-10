# EKB Flowers (`flower-shop-ru`)

Flower and gift delivery storefront for Russia — **[ekb-flowers.ru](https://www.ekb-flowers.ru)**.

This repository is **independent** from [lannabloom.shop](https://lannabloom.shop) (Thailand). Do not share env files, Vercel projects, databases, or Blob stores between them.

## Status

| Area | MVP (now) | Later |
|------|-----------|--------|
| Hosting | [Vercel](https://vercel.com) Hobby (free) | [Timeweb VPS](docs/deploy-vps.md) when catalog + sales are ready |
| Database | [Supabase](https://supabase.com) Postgres via Vercel (free) | Postgres on VPS |
| Images | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (free tier) | VPS disk `/var/www/catalog/` |
| Payments | Disabled in UI | YooKassa |
| Partners / catalog | Partner apply form; catalog grows as partners join | Admin uploads, full catalog |

**Domain:** registered at REG.RU. Point DNS (`@` and `www`) to **Vercel**, not REG.RU shared hosting (FTP/MySQL). See [Deploy](#deploy-to-vercel) below.

## Golden rules

- **Never** deploy this repo to the Thailand Vercel project.
- **Never** set Thailand runtime credentials — the app refuses to start if it finds `SUPABASE_*`, `STRIPE_*`, or `NEXT_PUBLIC_GTM_ID`. Use this repo's own Vercel Blob store only. See [`.env.example`](.env.example).
- **Never** write to Thailand Supabase from runtime code. Export scripts are read-only and run locally only.

## Tech stack

- **Next.js 14** (App Router), **React 18**, **TypeScript**
- **PostgreSQL** via `pg` (`DATABASE_URL`)
- **NextAuth** — admin at `/admin`
- **Yandex Metrica** (optional, browser only)

## Local development

```bash
npm install
cp .env.example .env.local   # fill Russia-only variables
docker compose up postgres -d  # optional: local Postgres
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Apply the catalog schema once (Supabase SQL editor or local Postgres):

```bash
# local Docker Postgres example:
docker compose exec -T postgres psql -U flower -d flower_ru < db/migrations/001_catalog_schema.sql
```

### Environment variables

Copy [`.env.example`](.env.example) → `.env.local`. Minimum for MVP:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://www.ekb-flowers.ru` |
| `DATABASE_URL` | Supabase Postgres pooler URL or local Docker Postgres |
| `AUTH_SECRET` | Random 32+ char secret for admin login |
| `ADMIN_SEED_EMAIL` | `k.v.polovnikov@gmail.com` (first admin user) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (catalog images on Vercel deploy) |

Do **not** copy `.env.local` from the Thailand `flower_shop` repo.

## Deploy to Vercel

1. Push this repo to GitHub: [github.com/SuperShot3/flower-shop-ru](https://github.com/SuperShot3/flower-shop-ru)
2. [Vercel](https://vercel.com) → **Add New Project** → import `flower-shop-ru` (new project, not Thailand).
3. Add the same env vars as `.env.local` in Vercel → Settings → Environment Variables.
4. Vercel → **Storage** → connect **Supabase** Postgres, run `db/migrations/001_catalog_schema.sql` in SQL editor, confirm `DATABASE_URL`.
5. Vercel → Storage → **Blob** → connect store → set `BLOB_READ_WRITE_TOKEN`.
6. Vercel → Settings → **Domains** → add `ekb-flowers.ru` and `www.ekb-flowers.ru`.
7. In REG.RU DNS, point records to Vercel (values shown in the Domains UI), for example:

   | Type | Host | Value |
   |------|------|--------|
   | A | `@` | Vercel A record (e.g. `76.76.21.21`) |
   | CNAME | `www` | `cname.vercel-dns.com` |

8. Set `NEXT_PUBLIC_APP_URL=https://www.ekb-flowers.ru` in Vercel and redeploy.

SSL is issued automatically by Vercel after DNS propagates.

## One-time migration from Thailand (optional)

When you need real bouquet data, run from your Mac only using `.env.export.local` (gitignored). Full step-by-step guide: **[docs/export-catalog-from-thailand.md](docs/export-catalog-from-thailand.md)**

```bash
npm run mirror-catalog:dry-run    # preview image paths
npm run mirror-catalog            # download images (+ Vercel Blob if token set)
npm run import-catalog-pg:dry-run # preview row counts
npm run import-catalog-pg         # insert bouquets into Russia Postgres
```

Uses `SUPABASE_EXPORT_*` — never deploy export credentials to Vercel or VPS.

## Project layout

```
app/[lang]/          # Storefront (en / th — Russian locale TBD)
app/admin/           # Staff dashboard
app/api/             # Route handlers
lib/db/              # Postgres catalog reads
lib/catalog/         # Images, mappers, types
db/migrations/       # SQL schema
docs/deploy-vps.md   # Future Timeweb VPS runbook
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run check-isolation` | Fail if Thailand env vars are set |
| `npm run mirror-catalog` | Download Thailand catalog images (local) |
| `npm run import-catalog-pg` | Import catalog into Postgres |

## Further reading

- [docs/deploy-vps.md](docs/deploy-vps.md) — production on Timeweb VPS (post-MVP)
- [ai_context/00_START_HERE.md](ai_context/00_START_HERE.md) — agent / developer context
- [AGENTS.md](AGENTS.md) — where code lives

## License

Private project.
