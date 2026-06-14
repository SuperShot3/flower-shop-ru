/**
 * Canonical delivery destinations and URL market slugs.
 * Internal id `CHIANG_MAI` is the primary Yekaterinburg service area (legacy key from Thailand fork).
 */

import { type Locale } from '@/lib/i18n';

export const DELIVERY_DESTINATIONS = [
  'CHIANG_MAI',
  'VERKHNYAYA_PYSHMA',
  'PERVOURALSK',
  'BEREZOVSKY',
  'ARAMIL',
] as const;

export type DeliveryDestinationId = (typeof DELIVERY_DESTINATIONS)[number];

/** Satellite cities around Yekaterinburg (not the main city districts). */
export const EXPANSION_DESTINATION_IDS: DeliveryDestinationId[] = [
  'VERKHNYAYA_PYSHMA',
  'PERVOURALSK',
  'BEREZOVSKY',
  'ARAMIL',
];

export const MARKET_PATH_SLUGS = [
  'verkhnyaya-pyshma',
  'pervouralsk',
  'berezovsky',
  'aramil',
] as const;

export type MarketPathSlug = (typeof MARKET_PATH_SLUGS)[number];

export interface MarketRegistryEntry {
  pathSlug: MarketPathSlug;
  destinationId: DeliveryDestinationId;
  customerFacingNameEn: string;
  /** Russian display name (field name kept from Thailand fork). */
  customerFacingNameRu: string;
}

export const MARKETS: MarketRegistryEntry[] = [
  {
    pathSlug: 'verkhnyaya-pyshma',
    destinationId: 'VERKHNYAYA_PYSHMA',
    customerFacingNameEn: 'Verkhnyaya Pyshma',
    customerFacingNameRu: 'Верхняя Пышма',
  },
  {
    pathSlug: 'pervouralsk',
    destinationId: 'PERVOURALSK',
    customerFacingNameEn: 'Pervouralsk',
    customerFacingNameRu: 'Первоуральск',
  },
  {
    pathSlug: 'berezovsky',
    destinationId: 'BEREZOVSKY',
    customerFacingNameEn: 'Berezovsky',
    customerFacingNameRu: 'Берёзовский',
  },
  {
    pathSlug: 'aramil',
    destinationId: 'ARAMIL',
    customerFacingNameEn: 'Aramil',
    customerFacingNameRu: 'Арамиль',
  },
];

const SLUG_TO_ENTRY: Record<string, MarketRegistryEntry> = Object.fromEntries(
  MARKETS.map((m) => [m.pathSlug, m])
);

export function getMarketByPathSlug(slug: string): MarketRegistryEntry | null {
  return SLUG_TO_ENTRY[slug] ?? null;
}

export function isMarketPathSlug(s: string): s is MarketPathSlug {
  return (MARKET_PATH_SLUGS as readonly string[]).includes(s);
}

export function isExpansionDestination(id: DeliveryDestinationId): boolean {
  return id !== 'CHIANG_MAI';
}

export function destinationDisplayName(
  id: DeliveryDestinationId,
  lang: Locale
): string {
  if (id === 'CHIANG_MAI') {
    return lang === 'ru' ? 'Екатеринбург' : 'Yekaterinburg';
  }
  const m = MARKETS.find((x) => x.destinationId === id);
  if (!m) return id;
  return lang === 'ru' ? m.customerFacingNameRu : m.customerFacingNameEn;
}

/** @deprecated Use customerFacingNameRu — kept for Thailand-era call sites. */
export function marketLabelRu(entry: MarketRegistryEntry): string {
  return entry.customerFacingNameRu;
}
