# Security rules — EKB Flowers

Non-negotiable trust boundaries for APIs, orders, and admin.

## Russia isolation (`validateRussiaEnv`)

At startup, `instrumentation.ts` calls `assertRussiaRuntimeEnv()`. These vars must **not** be set in Russia runtime (Vercel or local):

| Forbidden | Reason |
|-----------|--------|
| `SUPABASE_*` | Thailand database — use `DATABASE_URL` (Neon/VPS Postgres) |
| `STRIPE_*` | Thailand payments — YooKassa later |
| `NEXT_PUBLIC_GTM_ID` | Thailand analytics — use Yandex Metrica |
| `RESEND_API_KEY` | Thailand email — defer or RU SMTP later |

**Allowed for Russia MVP:** `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` (this repo's **own** Vercel Blob store), `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.

Run `npm run check-isolation` to scan for Thailand domain/IDs in source.

## Never trust the client for

- Line item prices, quantities, or product IDs used for charging
- Cart subtotals, delivery fees, discounts, or grand totals
- Payment status, order status, or fulfillment status
- User role, admin permissions, or order ownership
- `public_token` validity (must be verified server-side)

**Server must recompute** pricing from catalog/checkout rules when payments are enabled.

## Secrets and keys

| Secret | Rule |
|--------|------|
| `DATABASE_URL` | Server-only. Never `NEXT_PUBLIC_*`. |
| `BLOB_READ_WRITE_TOKEN` | Server-only. Russia Vercel project Blob only — not Thailand store. |
| `AUTH_SECRET` | Admin session signing only. |
| `ADMIN_SEED_PASSWORD` | Local/CI seed only — never commit. |

## Admin access

- Routes under `/admin` (except login) require NextAuth — `middleware.ts` + `auth.ts`.
- Admin API routes must verify session/RBAC (`lib/adminRbac.ts`).
- Primary seed admin: **`k.v.polovnikov@gmail.com`** (`ADMIN_SEED_EMAIL`).
- Password login rate-limited (`lib/rateLimit.ts`).

## Customer order access

- `GET /api/orders/[orderId]` requires valid `public_token`.
- Invalid or missing token → **404** (not 401 with details).

## Checkout (MVP)

- Online payment disabled in `lib/checkout/paymentAvailability.ts`.
- When adding YooKassa: verify webhook signatures server-side; create orders only after confirmed payment (same trust model as Thailand Stripe).

## Legacy Thailand sections

The following applied to Lanna Bloom / Supabase / Stripe and remain in code/docs for reference during migration:

- Stripe webhook idempotency (`stripe_events`)
- Supabase RLS and service role patterns (`lib/supabase/`)
- See [04_CHECKOUT_ORDERS_STRIPE.md](04_CHECKOUT_ORDERS_STRIPE.md) for Stripe flow (do not enable in Russia)

## When changing security-sensitive code

1. Read this file.
2. Trace happy path and attacker path (tampered body, missing token).
3. Prefer 404 over leaking whether an order id exists.
4. Confirm no Thailand secrets in env or client bundles.
