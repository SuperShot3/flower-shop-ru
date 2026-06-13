/**
 * Yandex Maps helpers — no API, no scripts, URL building/validation only.
 */

import { isValidGoogleMapsUrl } from '@/lib/googleMapsUrl';

/** Default map view (Yekaterinburg) when opening without a search query. */
export const YANDEX_MAPS_OPEN_URL =
  'https://yandex.ru/maps/?ll=60.605700%2C56.838900&z=12';

/** Yandex Maps widget embed — service area overview (no API key). */
export function getYandexMapsEmbedSrc(lang: 'ru' | 'en' = 'ru'): string {
  const mapLang = lang === 'ru' ? 'ru_RU' : 'en_US';
  return `https://yandex.ru/map-widget/v1/?ll=60.605700%2C56.838900&z=10&lang=${mapLang}`;
}

function normalizeUrl(raw: string): URL | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return new URL(/^[a-zA-Z][a-zA-Z+\-.]*:\/\//.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
}

function isYandexMapsHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'maps.yandex.ru' || /^maps\.yandex\.[a-z.]+$/.test(h)) return true;
  return /^(.+\.)?yandex\.(ru|com|by|kz|uz)$/.test(h);
}

export function isValidYandexMapsUrl(raw: string): boolean {
  const url = normalizeUrl(raw);
  if (!url) return false;
  if (!isYandexMapsHost(url.hostname)) return false;
  const path = url.pathname.toLowerCase();
  return path === '/maps' || path.startsWith('/maps/');
}

/** Accept Yandex links; also legacy Google links during transition. */
export function isValidCheckoutMapsUrl(raw: string): boolean {
  return isValidYandexMapsUrl(raw) || isValidGoogleMapsUrl(raw);
}

export function buildYandexMapsSearchUrl(address: string): string {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(address.trim())}`;
}

/** Opens Yandex Maps in a new tab — search by address if provided, otherwise default map. */
export function openYandexMapsForAddress(address: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = address.trim();
  const url = trimmed ? buildYandexMapsSearchUrl(trimmed) : YANDEX_MAPS_OPEN_URL;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** @deprecated Use openYandexMapsForAddress */
export function openAddressInYandexMaps(address: string): boolean {
  openYandexMapsForAddress(address);
  return true;
}
