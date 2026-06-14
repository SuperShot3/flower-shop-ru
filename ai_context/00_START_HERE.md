# Start here — EKB Flowers (Russia)

Read this before substantive work. Pick the topic file below for your task.

## Project

**EKB Flowers** — direct-to-consumer flower delivery in Yekaterinburg ([ekb-flowers.ru](https://www.ekb-flowers.ru)).

| Layer | Technology |
|-------|------------|
| App | Next.js 14, React 18, TypeScript |
| Hosting | Vercel |
| Data | Supabase Postgres (`POSTGRES_URL`) + Storage (`catalog` bucket) |
| Domain | REG.RU → DNS to Vercel |
| Payments | Disabled until YooKassa — `lib/checkout/paymentAvailability.ts` |
| Analytics | Yandex Metrica (`NEXT_PUBLIC_YANDEX_METRICA_ID`) |
| Admin | NextAuth at `/admin` — seed `k.v.polovnikov@gmail.com` |

## Topic files

| Read this | When you work on |
|-----------|------------------|
| [01_PROJECT_HANDOVER.md](01_PROJECT_HANDOVER.md) | Business scope, MVP, locales |
| [02_ARCHITECTURE_MAP.md](02_ARCHITECTURE_MAP.md) | Routes, folders, code locations |
| [03_SECURITY_RULES.md](03_SECURITY_RULES.md) | APIs, auth, env vars, migrations |
| [04_CHECKOUT_ORDERS_STRIPE.md](04_CHECKOUT_ORDERS_STRIPE.md) | Cart, checkout, orders, payments |
| [05_ANALYTICS_GTM_GA4_ADS.md](05_ANALYTICS_GTM_GA4_ADS.md) | Yandex Metrica, legacy GTM |
| [06_ADMIN_ACCOUNTING_EMAIL.md](06_ADMIN_ACCOUNTING_EMAIL.md) | Admin UI, accounting, email |
| [07_UI_OVERLAYS.md](07_UI_OVERLAYS.md) | Popover and checkout panel animations |

## Rules of thumb

1. Inspect the code — do not rely on memory.
2. Server recomputes money — never trust client prices.
3. Product/blog copy — use `.cursor/skills/flower-content-writer/` or `blog-content-writer/`.
4. REG.RU FTP/MySQL is not used — DNS only.

## Env vars

See [`.env.example`](../.env.example). Blocked credentials: [03_SECURITY_RULES.md](03_SECURITY_RULES.md).

## More

- [README.md](../README.md) — setup and deploy
- `docs/` — runbooks
