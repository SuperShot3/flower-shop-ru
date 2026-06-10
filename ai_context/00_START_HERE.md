# Start here — EKB Flowers (Russia)

Read this file before substantive work. Use topic files below for depth; use `docs/` for full runbooks.

## What this is

**EKB Flowers** — flower and gift delivery storefront for Russia ([ekb-flowers.ru](https://www.ekb-flowers.ru)). Forked from Lanna Bloom (Thailand); **fully isolated** from [lannabloom.shop](https://lannabloom.shop).

**MVP focus:** live site on custom domain, partner application form, empty/minimal catalog. Payments (YooKassa) and full partner catalog come later.

## Stack (MVP — current)

| Layer | Technology |
|-------|------------|
| App | Next.js 14 App Router, React 18, TypeScript |
| Hosting | **Vercel** Hobby (separate project from Thailand) |
| Database | **Neon** Postgres (`DATABASE_URL`) — catalog, partners, orders (later) |
| Catalog images | **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`) until VPS migration |
| Domain | `ekb-flowers.ru` at REG.RU → DNS to Vercel |
| Payments | **Disabled** — `lib/checkout/paymentAvailability.ts` |
| Analytics | **Yandex Metrica** (`NEXT_PUBLIC_YANDEX_METRICA_ID`) — not GTM/GA4 |
| Admin auth | NextAuth (`/admin`) — seed `k.v.polovnikov@gmail.com` |

## Stack (later — when selling)

| Layer | Technology |
|-------|------------|
| Hosting | Timeweb VPS + Docker — see [docs/deploy-vps.md](../docs/deploy-vps.md) |
| Database | Postgres on VPS |
| Images | VPS disk `/var/www/catalog/` (nginx) |

## Isolation rules

- **Never** deploy this repo to the Thailand Vercel project or share env/Blob/DB with Thailand.
- **Never** set Thailand runtime credentials — `lib/env/validateRussiaEnv.ts` blocks `SUPABASE_*`, `STRIPE_*`, `NEXT_PUBLIC_GTM_ID`, `RESEND_API_KEY`.
- Export scripts may **read** Thailand Supabase via `.env.export.local` only (local Mac, gitignored).

## Context index

| File | When to read |
|------|----------------|
| [01_PROJECT_HANDOVER.md](01_PROJECT_HANDOVER.md) | Business, locales, partners, MVP scope |
| [02_ARCHITECTURE_MAP.md](02_ARCHITECTURE_MAP.md) | Routes, folders, key entry points |
| [03_SECURITY_RULES.md](03_SECURITY_RULES.md) | API trust, tokens, forbidden env vars |
| [04_CHECKOUT_ORDERS_STRIPE.md](04_CHECKOUT_ORDERS_STRIPE.md) | Legacy Stripe doc + Russia payment plan |
| [05_ANALYTICS_GTM_GA4_ADS.md](05_ANALYTICS_GTM_GA4_ADS.md) | Thailand GTM (legacy) + Yandex Metrica |
| [06_ADMIN_ACCOUNTING_EMAIL.md](06_ADMIN_ACCOUNTING_EMAIL.md) | Admin UI, seed user, email (deferred) |

## Where is X? (quick map)

| Topic | Primary locations |
|-------|-------------------|
| Catalog reads | `lib/catalog.ts`, `lib/db/catalogRead.ts`, `lib/catalogReads.ts` |
| Catalog images | `lib/catalog/storage.ts`, Vercel Blob (MVP) |
| Partner apply | `app/[lang]/partner/apply/` |
| Checkout UI | `app/[lang]/cart/`, `app/[lang]/checkout/` |
| Payment gate | `lib/checkout/paymentAvailability.ts` |
| Admin dashboard | `app/admin/(dashboard)/` |
| Admin login | `auth.ts`, `app/admin/login/` |
| Russia env guard | `lib/env/validateRussiaEnv.ts`, `instrumentation.ts` |
| DB client | `lib/db/client.ts` |
| Schema | `db/migrations/001_catalog_schema.sql` |

## Env vars (names only — see `.env.example`)

**Never expose server secrets to the client.**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://www.ekb-flowers.ru` |
| `DATABASE_URL` | Neon or local Postgres |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — **this project's store only** |
| `AUTH_SECRET` | Admin NextAuth |
| `ADMIN_SEED_EMAIL` | `k.v.polovnikov@gmail.com` (seed script) |
| `ADMIN_SEED_PASSWORD` | Set locally; never commit |
| `NEXT_PUBLIC_YANDEX_METRICA_ID` | Analytics (optional MVP) |

**Forbidden at runtime:** `SUPABASE_*`, `STRIPE_*`, `NEXT_PUBLIC_GTM_ID`, `RESEND_API_KEY` (Thailand stack).

## Agent rules of thumb

1. **Inspect code** — much of `lib/supabase/` and Stripe routes are Thailand legacy; Russia MVP uses `lib/db/*` + Postgres.
2. **Server recomputes money** — never trust client prices (still applies when YooKassa ships).
3. **Do not enable Stripe or Thailand Supabase** in this repo's production env.
4. **Content copy** — use `.cursor/skills/` writers for product/blog text.
5. **REG.RU FTP/MySQL** — not used; domain DNS points to Vercel.

## Deep dive (`docs/`)

- [docs/deploy-vps.md](../docs/deploy-vps.md) — future Timeweb VPS
- [README.md](../README.md) — setup and Vercel deploy checklist
