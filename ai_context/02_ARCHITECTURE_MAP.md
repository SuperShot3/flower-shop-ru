# Architecture map — EKB Flowers

Where code lives in the Next.js App Router monorepo.

## Top-level routes

| Path | Purpose |
|------|---------|
| `app/[lang]/` | Localized storefront (`en`, `th` — RU locale TBD) |
| `app/order/[orderId]/` | Customer order status (token in query) |
| `app/admin/` | Staff dashboard + login |
| `app/api/` | Route handlers (admin, health; Stripe legacy) |
| `app/task/[token]/` | Supplier task (neutral links) |
| `content/` | MDX info articles, guides |

## Storefront (`app/[lang]/`)

| Area | Path |
|------|------|
| Home | locale root |
| Catalog | `catalog/`, `(markets)/[market]/catalog/` |
| Product | `catalog/[slug]/` |
| Cart | `cart/` |
| Checkout | `checkout/complete`, `checkout/success`, `checkout/confirmation-pending` |
| Info / SEO | `info/[slug]/`, guides |
| Partner apply | `partner/apply` |
| Static pages | `privacy`, `terms`, `contact`, etc. |

## APIs (`app/api/`)

| Prefix | Purpose |
|--------|---------|
| `stripe/` | **Legacy (Thailand)** — do not use in Russia production |
| `orders/` | Public order fetch (token-gated) |
| `admin/` | Authenticated admin mutations |
| `bouquets/` | Catalog helpers |
| `cron/` | Scheduled jobs |
| `health/` | Health checks |

## Admin (`app/admin/`)

| Area | Path |
|------|------|
| Login | `login/` |
| Dashboard shell | `(dashboard)/layout.tsx` |
| Orders | `(dashboard)/orders/` |
| Products / moderation | `(dashboard)/products/` |
| Partners | `(dashboard)/partners/applications` |

## Core `lib/` modules (Russia path)

| Module | Role |
|--------|------|
| `lib/db/client.ts` | Postgres pool (`POSTGRES_URL`) |
| `lib/db/catalogRead.ts` | Catalog reads from Postgres |
| `lib/catalog.ts`, `lib/catalogReads.ts` | Storefront catalog facade |
| `lib/catalog/storage.ts` | Image URLs; Blob upload (MVP) |
| `lib/checkout/paymentAvailability.ts` | Payment disabled until YooKassa |
| `lib/env/validateRussiaEnv.ts` | Block Thailand runtime env vars |
| `lib/delivery/` | Zones, markets, fees |
| `lib/adminRbac.ts` | Admin permissions |
| `lib/i18n.ts` | Locale types/helpers |

## Legacy Thailand modules (do not wire to Russia prod)

| Module | Notes |
|--------|-------|
| `lib/supabase/*` | Still in tree; migrate callers to `lib/db/*` |
| `lib/stripe/*`, `app/api/stripe/*` | Stripe — forbidden in Russia env |
| `lib/orders/supabaseStore.ts` | Thailand order store |

## Auth

| File | Role |
|------|------|
| `auth.ts` | NextAuth (admin) — migrating to Postgres `admin_users` |
| `middleware.ts` | Protects `/admin` |

## Data stores (MVP)

| Store | Used for |
|-------|----------|
| **Supabase Postgres** | Catalog, partner applications, admin users (via `pg` + `POSTGRES_URL` from Vercel integration) |
| **Vercel Blob** | Catalog image files (MVP) |
| Legacy `lib/supabase/*` client / Stripe routes | Not wired for MVP storefront |

## Data stores (post-VPS)

See [docs/deploy-vps.md](../docs/deploy-vps.md) — Postgres + disk on Timeweb VPS.

## Config

| File | Role |
|------|------|
| `next.config.js` | Next config, `transpilePackages` |
| `.env.example` | Russia env documentation |
| `db/migrations/` | Postgres schema (not `supabase/migrations/` for Russia prod) |
| `docker-compose.yml` | Local / future VPS Postgres |

## Cross-cutting flows

- Security → [03_SECURITY_RULES.md](03_SECURITY_RULES.md)
- Payments (legacy + plan) → [04_CHECKOUT_ORDERS_STRIPE.md](04_CHECKOUT_ORDERS_STRIPE.md)
- Analytics → [05_ANALYTICS_GTM_GA4_ADS.md](05_ANALYTICS_GTM_GA4_ADS.md)
- Admin → [06_ADMIN_ACCOUNTING_EMAIL.md](06_ADMIN_ACCOUNTING_EMAIL.md)
