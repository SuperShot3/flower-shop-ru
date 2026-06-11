# Start here — EKB Flowers (Russia)

Read this file before substantive work. Use topic files below for depth; use `docs/` for full runbooks.

## What this is

**EKB Flowers** — flower and gift delivery storefront for Russia ([ekb-flowers.ru](https://www.ekb-flowers.ru)).

**MVP focus:** live site on custom domain, partner application form, empty/minimal catalog. Payments (YooKassa) and full partner catalog come later.

## Stack (MVP — current)

| Layer | Technology |
|-------|------------|
| App | Next.js 14 App Router, React 18, TypeScript |
| Hosting | **Vercel** Hobby |
| Database | **Supabase** Postgres via `POSTGRES_URL` — catalog, partners, orders (later) |
| Catalog images | **Supabase Storage** (`catalog` bucket) |
| Domain | `ekb-flowers.ru` at REG.RU → DNS to Vercel |
| Payments | **Disabled** — `lib/checkout/paymentAvailability.ts` |
| Analytics | **Yandex Metrica** (`NEXT_PUBLIC_YANDEX_METRICA_ID`) — not GTM/GA4 |
| Admin auth | NextAuth (`/admin`) — seed `k.v.polovnikov@gmail.com` |

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
| Catalog images | `lib/catalog/storage.ts`, Supabase Storage `catalog` bucket |
| Partner apply | `app/[lang]/partner/apply/` |
| Checkout UI | `app/[lang]/cart/`, `app/[lang]/checkout/` |
| Payment gate | `lib/checkout/paymentAvailability.ts` |
| Admin dashboard | `app/admin/(dashboard)/` |
| Admin login | `auth.ts`, `app/admin/login/` |
| Russia env guard | `lib/env/validateRussiaEnv.ts`, `instrumentation.ts` |
| DB client | `lib/db/client.ts` |
| Schema (fresh DB) | `db/bootstrap/` (7 files) — `npm run db:bootstrap:apply` — see `docs/DATABASE_BOOTSTRAP.md` |
| Schema (legacy history) | `supabase/migrations/` (68 incremental; do not squash on live DBs) |

## Env vars (names only — see `.env.example`)

**Never expose server secrets to the client.**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://www.ekb-flowers.ru` |
| `POSTGRES_URL` | Supabase Postgres pooler URL (Vercel integration or `.env.local`) |
| `SUPABASE_URL` | Russia Supabase project URL — admin client + Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — admin bypass RLS, storage uploads |
| `SUPABASE_ANON_KEY` | Server-only — customer order reads via `x-order-token` RLS |
| `AUTH_SECRET` | Admin NextAuth |
| `ADMIN_SEED_EMAIL` | `k.v.polovnikov@gmail.com` (seed script) |
| `ADMIN_SEED_PASSWORD` | Set locally; never commit |
| `NEXT_PUBLIC_YANDEX_METRICA_ID` | Analytics (optional MVP) |

**Blocked credentials:** see `lib/env/validateRussiaEnv.ts` and [03_SECURITY_RULES.md](03_SECURITY_RULES.md).

## Agent rules of thumb

1. **Inspect code** — storefront catalog uses `lib/db/*` + Postgres (`POSTGRES_URL`).
2. **Server recomputes money** — never trust client prices (still applies when YooKassa ships).
3. **Content copy** — use `.cursor/skills/` writers for product/blog text.
4. **REG.RU FTP/MySQL** — not used; domain DNS points to Vercel.

## Deep dive (`docs/`)

- [README.md](../README.md) — setup and Vercel deploy checklist
