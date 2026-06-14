# Project handover — EKB Flowers

Business and product context for the **Russia** storefront ([ekb-flowers.ru](https://www.ekb-flowers.ru)).

## Brand and audience

- **Name:** EKB Flowers (working title; Yekaterinburg / Russia focus)
- **Domain:** [ekb-flowers.ru](https://www.ekb-flowers.ru) (REG.RU registrar)
- **Market:** Russia — **Yekaterinburg only** at launch (more cities later); Russian-first localization planned; `/en` and `/th` routes exist from Thailand fork
- **Relation to Thailand:** Independent from **Lanna Bloom** ([lannabloom.shop](https://lannabloom.shop)) — separate repo, Vercel project, database, Blob store

## Business goal

**Direct-to-consumer flower delivery** in Yekaterinburg. Customers browse the catalog, add bouquets to cart, and place orders.

## MVP scope (current phase)

| In scope | Out of scope (later) |
|----------|----------------------|
| Site live on `ekb-flowers.ru` | YooKassa live payments |
| Customer catalog with bouquets and prices | Full catalog migration from Thailand |
| Cart + checkout UI | Accounting/email automation |
| Static/legal pages | — |
| Admin login for staff | — |

**Goal now:** customers can browse bouquets and place orders. Add YooKassa when ready to accept online payment.

## Customer experience (MVP)

| Journey | Summary |
|---------|---------|
| Browse | Home + catalog |
| Cart / checkout | UI present; **online payment disabled** (`paymentAvailability`) |
| Pay | YooKassa — later |
| Order tracking | `/order/{orderId}?token=...` — when orders exist |

## Languages

- URL locales: `/en/*`, `/th/*` (Thailand copy may remain until Russian locale pass)
- Plan: Russian-first content for production launch in Russia

## Admin (staff)

- **URL:** `/admin`
- **Primary admin email:** `k.v.polovnikov@gmail.com` — seed via `ADMIN_SEED_EMAIL` + `scripts/seed-admin.ts`
- **Auth:** NextAuth + `AUTH_SECRET` (not shared with Thailand)
- RBAC via `lib/adminRbac.ts`

## Payments

- **MVP:** Checkout button disabled — message that online payment is being set up
- **Later:** YooKassa (requires Russian legal entity for production)
- **Do not** enable Stripe in this repo

## Infrastructure

| Layer | Technology |
|-------|------------|
| Hosting | Vercel |
| Database | Supabase Postgres (`POSTGRES_URL`) |
| Images | Supabase Storage (`catalog` bucket) |
| Payments (later) | YooKassa |

Domain DNS at REG.RU → Vercel. Ignore REG.RU shared hosting FTP/MySQL for this app.

## Content

- Product/blog copy: `.cursor/skills/flower-content-writer/`, `blog-content-writer/`
- MDX articles under `content/` (Thailand SEO — review before RU launch)

## Deep dive

- [README.md](../README.md) — deploy and env setup
