# Project handover — EKB Flowers

Business and product context for the **Russia** storefront ([ekb-flowers.ru](https://www.ekb-flowers.ru)).

## Brand and audience

- **Name:** EKB Flowers (working title; Yekaterinburg / Russia focus)
- **Domain:** [ekb-flowers.ru](https://www.ekb-flowers.ru) (REG.RU registrar)
- **Market:** Russia — Russian-first localization planned; `/en` and `/th` routes exist from Thailand fork
- **Relation to Thailand:** Independent from **Lanna Bloom** ([lannabloom.shop](https://lannabloom.shop)) — separate repo, Vercel project, database, Blob store

## MVP scope (current phase)

| In scope | Out of scope (later) |
|----------|----------------------|
| Site live on `ekb-flowers.ru` | YooKassa live payments |
| Partner **apply** form | Partner dashboard / self-serve uploads |
| Empty or minimal catalog | Full catalog migration from Thailand |
| Static/legal pages | VPS migration |
| Admin login for staff | Accounting/email automation |

**Goal now:** show a credible storefront URL while recruiting florist partners. Add partner images to catalog as they sign up. Move to Timeweb VPS when ready to sell at scale.

## Customer experience (MVP)

| Journey | Summary |
|---------|---------|
| Browse | Home + catalog (may be empty / coming soon) |
| Partner | `/[lang]/partner/apply` — application form |
| Cart / checkout | UI present; **online payment disabled** (`paymentAvailability`) |
| Pay | YooKassa — step 6, not MVP |
| Order tracking | `/order/{orderId}?token=...` — when orders exist |

## Languages

- URL locales: `/en/*`, `/th/*` (Thailand copy may remain until Russian locale pass)
- Plan: Russian-first content for production launch in Russia

## Partner flow (MVP)

1. **Apply** — `/[lang]/partner/apply` → Postgres `partner_applications` (migration in progress from Supabase)
2. **Admin review** — `/admin/partners/applications` (staff approves manually)
3. **Catalog** — staff adds partner bouquets/images via admin when ready

No self-serve partner portal in MVP.

## Admin (staff)

- **URL:** `/admin`
- **Primary admin email:** `k.v.polovnikov@gmail.com` — seed via `ADMIN_SEED_EMAIL` + `scripts/seed-admin.ts` (Postgres migration in progress)
- **Auth:** NextAuth + `AUTH_SECRET` (not shared with Thailand)
- RBAC via `lib/adminRbac.ts`

## Payments

- **MVP:** Checkout button disabled — message that online payment is being set up
- **Later:** YooKassa (requires Russian legal entity for production)
- **Do not** enable Stripe in this repo

## Infrastructure

| Phase | Hosting | DB | Images |
|-------|---------|-----|--------|
| **Now (MVP)** | Vercel | Neon Postgres | Vercel Blob |
| **Later** | Timeweb VPS | Postgres on VPS | `/var/www/catalog/` |

Domain DNS at REG.RU → Vercel. Ignore REG.RU shared hosting FTP/MySQL for this app.

## Content

- Product/blog copy: `.cursor/skills/flower-content-writer/`, `blog-content-writer/`
- MDX articles under `content/` (Thailand SEO — review before RU launch)

## Deep dive

- [README.md](../README.md) — deploy and env setup
- [docs/deploy-vps.md](../docs/deploy-vps.md) — post-MVP VPS runbook
