# Analytics — EKB Flowers

## Russia MVP: Yandex Metrica

| Rule | Detail |
|------|--------|
| Provider | [Yandex Metrica](https://metrika.yandex.ru) — free browser counter |
| Env | `NEXT_PUBLIC_YANDEX_METRICA_ID` |
| Not used | GTM, GA4, Google Ads (`NEXT_PUBLIC_GTM_ID` is **forbidden** in Russia env) |

Add Metrica script in layout or dedicated component when ID is set. No server-side purchase events required for MVP (payments disabled).

---

## Legacy: Thailand GTM / GA4 / Google Ads

> The following applied to **lannabloom.shop**. Code may still exist (`components/GoogleAnalytics.tsx`, `lib/analytics.ts`) but must **not** be configured in Russia production.

### Architecture (Thailand)

| Rule | Detail |
|------|--------|
| Transport | GTM only (`NEXT_PUBLIC_GTM_ID`) |
| Production only | GTM loads when `NODE_ENV === 'production'` |
| Loader | `components/GoogleAnalytics.tsx` |
| Events | `lib/analytics.ts` → `dataLayer` |

### Canonical `purchase` (Thailand Stripe checkout)

- **Where:** `/lanna-order-thank-you` after Stripe `order-status` returns `paid`
- **Dedupe:** `localStorage` `lanna_purchase_fired_<orderId>`
- **No server-side GA4 purchase**

### Deep dive (Thailand)

- [docs/ANALYTICS_GA4.md](../docs/ANALYTICS_GA4.md)
- [docs/GOOGLE_ADS_PURCHASE_CONVERSION.md](../docs/GOOGLE_ADS_PURCHASE_CONVERSION.md)
