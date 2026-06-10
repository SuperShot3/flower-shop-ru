# Agent Instructions — EKB Flowers (Russia)

Before working on this repository, read [`ai_context/00_START_HERE.md`](ai_context/00_START_HERE.md).

**Site:** [ekb-flowers.ru](https://www.ekb-flowers.ru) · **Repo:** [github.com/SuperShot3/flower-shop-ru](https://github.com/SuperShot3/flower-shop-ru)

Read the relevant context file for the task:

| Task area | Context file |
|-----------|----------------|
| Business / MVP scope / partners | `ai_context/01_PROJECT_HANDOVER.md` |
| Where code lives | `ai_context/02_ARCHITECTURE_MAP.md` |
| Auth, API trust, forbidden env vars | `ai_context/03_SECURITY_RULES.md` |
| Checkout / orders / payments plan | `ai_context/04_CHECKOUT_ORDERS_STRIPE.md` |
| Yandex Metrica (Russia) / GTM legacy | `ai_context/05_ANALYTICS_GTM_GA4_ADS.md` |
| Admin (`k.v.polovnikov@gmail.com`) | `ai_context/06_ADMIN_ACCOUNTING_EMAIL.md` |

## MVP stack (current)

- **Vercel** + **Supabase Postgres** + **Vercel Blob** (free tier)
- Domain **ekb-flowers.ru** (REG.RU) → DNS to Vercel
- Payments **disabled**; YooKassa later
- **Timeweb VPS** — post-MVP ([docs/deploy-vps.md](docs/deploy-vps.md))

Do not rely on assumptions or memory. Inspect the actual code before editing.

For **product or blog copy**, use `.cursor/skills/flower-content-writer/` and `.cursor/skills/blog-content-writer/` instead of expanding `ai_context`.
