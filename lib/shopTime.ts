/**
 * EKB Flowers shop clock: Yekaterinburg service area.
 * Use for displaying order and ops timestamps so they match local expectations
 * regardless of the visitor's or server's timezone.
 */
export const SHOP_TIMEZONE = 'Asia/Yekaterinburg';

function clockLocaleTag(lang: string): string {
  if (lang === 'ru') return 'ru-RU';
  return 'en-GB';
}

/** Live clock string HH:mm in the shop timezone. */
export function formatShopClockTime(now: Date, lang: string): string {
  return now.toLocaleTimeString(clockLocaleTag(lang), {
    timeZone: SHOP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Short calendar date in the shop timezone (e.g. checkout header). */
export function formatShopClockDate(now: Date, lang: string): string {
  return now.toLocaleDateString(clockLocaleTag(lang), {
    timeZone: SHOP_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Today's calendar date in the shop timezone (YYYY-MM-DD). */
export function shopTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Add calendar days in the shop timezone; input/output YYYY-MM-DD. */
export function shopAddDays(ymd: string, deltaDays: number): string {
  const d = new Date(`${ymd}T12:00:00+05:00`);
  d.setDate(d.getDate() + deltaDays);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format an ISO / DB timestamp for display in the shop timezone.
 */
export function formatShopDateTime(iso: string | null | undefined, emptyLabel = '—'): string {
  if (iso == null || iso === '') return emptyLabel;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-GB', {
      timeZone: SHOP_TIMEZONE,
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}
