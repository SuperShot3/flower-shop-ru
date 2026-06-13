import { localeDateFormat, type Locale } from '@/lib/i18n';

export const STORE_CURRENCY = 'RUB' as const;

export function formatMoney(amount: number | null | undefined, lang: Locale = 'ru'): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat(localeDateFormat(lang), {
    style: 'currency',
    currency: STORE_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact price for tight UI (₽1 500). */
export function formatPriceCompact(amount: number, lang: Locale = 'ru'): string {
  const formatted = Number(amount).toLocaleString(localeDateFormat(lang), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `₽${formatted}`;
}
