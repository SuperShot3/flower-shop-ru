# Admin, accounting, and email — EKB Flowers

Internal ops under `/admin`. Requires NextAuth (`AUTH_SECRET`).

## Admin user (seed)

| Field | Value |
|-------|--------|
| Email | **`k.v.polovnikov@gmail.com`** |
| Env | `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` |
| Script | `scripts/seed-admin.ts` (migrating to Postgres `admin_users`) |

Seed after schema is applied:

```bash
ADMIN_SEED_EMAIL=k.v.polovnikov@gmail.com ADMIN_SEED_PASSWORD='...' npx tsx scripts/seed-admin.ts
```

Do not share `AUTH_SECRET` or admin password with the Thailand project.

## Admin areas

| Area | Route | MVP status |
|------|-------|------------|
| Partner applications | `/admin/partners/applications` | Active when Postgres wired |
| Products / moderation | `/admin/products/` | Use when partners join |
| Orders | `/admin/orders/` | After YooKassa |
| Accounting / expenses | `/admin/accounting/`, `/admin/expenses/` | Defer |
| Email Control Center | `/admin/emails/` | Defer (was Supabase + Resend) |

Admin APIs: `app/api/admin/**` — always verify session + RBAC.

## Accounting (deferred)

Thailand used Supabase-backed income/expenses sync. Russia MVP does not require accounting automation until live sales.

Reference: [docs/ACCOUNTING_AND_EXPENSES.md](../docs/ACCOUNTING_AND_EXPENSES.md) (Thailand-oriented).

## Email (deferred)

Thailand stack: Resend + Supabase `email_templates` / `email_outbox`.

Russia plan: RU SMTP or provider in step 6. Do not set `RESEND_API_KEY` in this repo.

## Receipt uploads (deferred)

Thailand used Supabase Storage. Russia MVP: catalog images via Vercel Blob; accounting proofs when accounting ships.

## Deep dive

- [docs/ADMIN_V2_COSTS.md](../docs/ADMIN_V2_COSTS.md) — Thailand cost model (reference)
