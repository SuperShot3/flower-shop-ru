# Checkout and orders — EKB Flowers

> **Russia MVP:** Online checkout is **disabled** (`lib/checkout/paymentAvailability.ts`, `canCheckout()` → `false`). Payments via **YooKassa** are planned; Stripe must not be enabled in this repo.
>
> The sections below describe the **Thailand / Stripe** implementation still present in the codebase. Use as a reference for trust boundaries when building YooKassa — not as active Russia production flow.

## Russia payment plan (future)

| Step | Detail |
|------|--------|
| Provider | YooKassa |
| Flow | Create payment → redirect → webhook `payment.succeeded` → fulfill order |
| Trust | Server confirms payment before creating order (mirror Thailand Stripe model) |
| Prerequisite | Russian legal entity (ИП/ООО) for production onboarding |

## Order storage (target — Postgres)

- Router: `lib/orders/router.ts`
- Russia target: Postgres via `lib/db/*` (migration in progress from `lib/orders/supabaseStore.ts`)

## MVP behavior

- Cart and checkout UI may render for UX testing.
- Pay button shows “payment being set up” — no charge.
- Do not set `STRIPE_*` env vars.

---

## Legacy: Thailand Stripe flow (reference only)

### Order storage (Thailand)

- **Primary:** Supabase (`ORDERS_PRIMARY_STORE=supabase`).
- Router: `lib/orders/router.ts` → `lib/orders/supabaseStore.ts`.

### Cart checkout flow (create order after payment)

Key files:

| Step | File |
|------|------|
| Create session | `app/api/stripe/create-checkout-session/route.ts` |
| Draft storage | `lib/checkout/checkoutDrafts.ts` |
| Fulfill | `lib/checkout/fulfillStripeCheckout.ts` |
| Webhook | `app/api/stripe/webhook/route.ts` |
| Order status poll | `app/api/stripe/order-status/route.ts` |

### Rules (still valid for any future payment provider)

- Never trust client totals.
- Create cart orders **after** confirmed payment only.
- Webhooks must be idempotent.
- Customer order pages require `public_token`.

## Deep dive (Thailand)

- [docs/ORDERS_SUPABASE.md](../docs/ORDERS_SUPABASE.md) — Thailand order store
