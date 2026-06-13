# EKB Flowers (`flower-shop-ru`)

Flower and gift delivery storefront for Russia — **[ekb-flowers.ru](https://www.ekb-flowers.ru)**.

This repository is **independent** from [lannabloom.shop](https://lannabloom.shop) (Thailand). Do not share env files, Vercel projects, databases, or Blob stores between them.

## Status

| Area | Now | Later |
|------|-----|-------|
| Hosting | [Vercel](https://vercel.com) Hobby | — |
| Database | [Supabase](https://supabase.com) Postgres via Vercel | — |
| Images | [Supabase Storage](https://supabase.com/docs/guides/storage) (`catalog` bucket) |
| Payments | Disabled in UI | YooKassa |
| Partners / catalog | Partner apply form; catalog grows as partners join | Full catalog |

**Domain:** registered at REG.RU. Point DNS (`@` and `www`) to **Vercel**, not REG.RU shared hosting (FTP/MySQL). See [Deploy](#deploy-to-vercel) below.

## Golden rules

- **Never** deploy this repo to the Thailand Vercel project.
- **Never** set Thailand runtime credentials — the app refuses to start if it finds Thailand Supabase ref, `STRIPE_*`, or `NEXT_PUBLIC_GTM_ID`. See [`.env.example`](.env.example).

## Tech stack

- **Next.js 14** (App Router), **React 18**, **TypeScript**
- **PostgreSQL** via `pg` (`POSTGRES_URL`)
- **Supabase Storage** — catalog images, receipts, proofs
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

Apply the full schema once (fresh Supabase project):

```bash
export POSTGRES_URL="postgres://..."
npm run db:bootstrap:apply
npm run db:verify-schema
npm run seed-admin   # requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

See [`docs/DATABASE_BOOTSTRAP.md`](docs/DATABASE_BOOTSTRAP.md).

### Environment variables

Copy [`.env.example`](.env.example) → `.env.local`. Minimum for MVP:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://www.ekb-flowers.ru` |
| `POSTGRES_URL` | Supabase Postgres pooler URL |
| `SUPABASE_URL` | Russia Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin + storage uploads (server-only) |
| `SUPABASE_ANON_KEY` | Customer order token reads (server-only) |
| `AUTH_SECRET` | Random 32+ char secret for admin login |
| `ADMIN_SEED_EMAIL` | `k.v.polovnikov@gmail.com` (first admin user) |

Do **not** copy `.env.local` from the Thailand `flower_shop` repo.

## Deploy to Vercel

1. Push this repo to GitHub: [github.com/SuperShot3/flower-shop-ru](https://github.com/SuperShot3/flower-shop-ru)
2. [Vercel](https://vercel.com) → **Add New Project** → import `flower-shop-ru` (new project, not Thailand).
3. Add env vars from `.env.example` in Vercel → Settings → Environment Variables (`POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `AUTH_SECRET`).
4. Connect **Supabase** Postgres, run `npm run db:bootstrap:apply`, then `npm run seed-admin` locally.
5. Vercel → Settings → **Domains** → add `ekb-flowers.ru` and `www.ekb-flowers.ru`.
6. In REG.RU DNS, point records to Vercel (values shown in the Domains UI), for example:

   | Type | Host | Value |
   |------|------|--------|
   | A | `@` | Vercel A record (e.g. `76.76.21.21`) |
   | CNAME | `www` | `cname.vercel-dns.com` |

7. Set `NEXT_PUBLIC_APP_URL=https://www.ekb-flowers.ru` in Vercel and redeploy.

SSL is issued automatically by Vercel after DNS propagates.

## Project layout

```
app/[lang]/          # Storefront (ru / en)
app/admin/           # Staff dashboard
app/api/             # Route handlers
lib/db/              # Postgres catalog reads
lib/catalog/         # Images, mappers, types
db/bootstrap/        # SQL schema (7 files)
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run check-isolation` | Fail if Thailand env vars are set |

## Further reading

- [ai_context/00_START_HERE.md](ai_context/00_START_HERE.md) — agent / developer context
- [AGENTS.md](AGENTS.md) — where code lives

## License

Private project.
