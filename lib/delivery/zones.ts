/**
 * Zone registry: delivery_destination + delivery_zone_id → fee (RUB).
 * Expansion fees are floored defensively in getZoneFee.
 */

import type { DeliveryDestinationId } from '@/lib/delivery/markets';
import { isExpansionDestination } from '@/lib/delivery/markets';
import type { DistrictKey } from '@/lib/deliveryFees';
import { isThaiLocale, type Locale } from '@/lib/i18n';

const EXPANSION_FEE_FLOOR_RUB = 300;

export interface DeliveryZoneDef {
  id: string;
  labelEn: string;
  labelRu: string;
  feeRub: number;
  /** When set, inferred postcode must match one of these or a prefix rule, else checkout rejected */
  postalCodes?: string[];
  postalPrefixes?: string[];
}

export const ZONES_BY_DESTINATION: Record<DeliveryDestinationId, DeliveryZoneDef[]> = {
  /** Primary service area — Yekaterinburg city districts. */
  CHIANG_MAI: [
    {
      id: 'ekb-ordzhonikidzevsky',
      labelEn: 'Ordzhonikidzevsky (Uralmash)',
      labelRu: 'Орджоникидзевский (Уралмаш)',
      feeRub: 300,
    },
    {
      id: 'ekb-zheleznodorozhny',
      labelEn: 'Zheleznodorozhny',
      labelRu: 'Железнодорожный',
      feeRub: 300,
    },
    {
      id: 'ekb-verkh-isetsky',
      labelEn: 'Verkh-Isetsky',
      labelRu: 'Верх-Исетский',
      feeRub: 350,
    },
    {
      id: 'ekb-kirovsky',
      labelEn: 'Kirovsky',
      labelRu: 'Кировский',
      feeRub: 350,
    },
    {
      id: 'ekb-leninsky',
      labelEn: 'Leninsky',
      labelRu: 'Ленинский',
      feeRub: 350,
    },
    {
      id: 'ekb-oktyabrsky',
      labelEn: 'Oktyabrsky',
      labelRu: 'Октябрьский',
      feeRub: 350,
    },
    {
      id: 'ekb-chkalovsky',
      labelEn: 'Chkalovsky',
      labelRu: 'Чкаловский',
      feeRub: 400,
    },
    {
      id: 'ekb-viz',
      labelEn: 'VIZ',
      labelRu: 'ВИЗ',
      feeRub: 400,
    },
    {
      id: 'ekb-akademichesky',
      labelEn: 'Akademichesky',
      labelRu: 'Академический',
      feeRub: 450,
    },
    {
      id: 'ekb-solnechny',
      labelEn: 'Solnechny',
      labelRu: 'Солнечный',
      feeRub: 450,
    },
    {
      id: 'ekb-uktus',
      labelEn: 'Uktus',
      labelRu: 'Уктус',
      feeRub: 450,
    },
    {
      id: 'ekb-unknown',
      labelEn: 'Other district / we will confirm',
      labelRu: 'Другой район / уточним',
      feeRub: 500,
    },
  ],
  VERKHNYAYA_PYSHMA: [
    {
      id: 'vpy-city',
      labelEn: 'Verkhnyaya Pyshma',
      labelRu: 'Верхняя Пышма',
      feeRub: 400,
    },
  ],
  PERVOURALSK: [
    {
      id: 'perv-city',
      labelEn: 'Pervouralsk',
      labelRu: 'Первоуральск',
      feeRub: 550,
    },
  ],
  BEREZOVSKY: [
    {
      id: 'ber-city',
      labelEn: 'Berezovsky',
      labelRu: 'Берёзовский',
      feeRub: 450,
    },
  ],
  ARAMIL: [
    {
      id: 'ara-city',
      labelEn: 'Aramil',
      labelRu: 'Арамиль',
      feeRub: 500,
    },
  ],
};

export function getZonesForDestination(destinationId: DeliveryDestinationId): DeliveryZoneDef[] {
  return ZONES_BY_DESTINATION[destinationId] ?? [];
}

export function findZoneDef(
  destinationId: DeliveryDestinationId,
  zoneId: string
): DeliveryZoneDef | undefined {
  return getZonesForDestination(destinationId).find((z) => z.id === zoneId);
}

export function isSupportedZone(destinationId: DeliveryDestinationId, zoneId: string): boolean {
  return Boolean(findZoneDef(destinationId, zoneId));
}

/**
 * Fee for destination + zone. Null if zone unknown for destination.
 */
export function getZoneFee(destinationId: DeliveryDestinationId, zoneId: string): number | null {
  const z = findZoneDef(destinationId, zoneId);
  if (!z) return null;
  if (isExpansionDestination(destinationId)) {
    return Math.max(z.feeRub, EXPANSION_FEE_FLOOR_RUB);
  }
  return z.feeRub;
}

export function zoneDisplayLabel(
  zone: DeliveryZoneDef,
  lang: Locale | 'th'
): string {
  if (lang === 'ru' || isThaiLocale(lang)) return zone.labelRu;
  return zone.labelEn;
}

export function zoneLabel(
  destinationId: DeliveryDestinationId,
  zoneId: string,
  lang: Locale | 'th'
): string | null {
  const z = findZoneDef(destinationId, zoneId);
  if (!z) return null;
  return zoneDisplayLabel(z, lang);
}

/** Map EKB zone id → legacy `district` column value for orders. */
export function legacyDistrictFromEkbZone(zoneId: string): {
  deliveryDistrict: DistrictKey;
  isMueangCentral: boolean;
} {
  const map: Record<string, DistrictKey> = {
    'ekb-ordzhonikidzevsky': 'ORDZHONIKIDZEVSKY',
    'ekb-zheleznodorozhny': 'ZHELEZNODOROZHNY',
    'ekb-verkh-isetsky': 'VERKH_ISETSKY',
    'ekb-kirovsky': 'KIROVSKY',
    'ekb-leninsky': 'LENINSKY',
    'ekb-oktyabrsky': 'OKTYABRSKY',
    'ekb-chkalovsky': 'CHKALOVSKY',
    'ekb-viz': 'VIZ',
    'ekb-akademichesky': 'AKADEMICHESKY',
    'ekb-solnechny': 'SOLNECHNY',
    'ekb-uktus': 'UKTUS',
    'ekb-unknown': 'UNKNOWN',
    'vpy-city': 'VERKHNYAYA_PYSHMA',
    'perv-city': 'PERVOURALSK',
    'ber-city': 'BEREZOVSKY',
    'ara-city': 'ARAMIL',
  };
  return {
    deliveryDistrict: map[zoneId] ?? 'UNKNOWN',
    isMueangCentral: false,
  };
}

/** @deprecated Use legacyDistrictFromEkbZone */
export const legacyDistrictFromChiangMaiZone = legacyDistrictFromEkbZone;

/** Migrate old cart form (district key) to EKB zone id */
export function ekbZoneIdFromLegacyDistrict(district: DistrictKey | ''): string {
  if (!district) return '';
  const d2z: Partial<Record<DistrictKey, string>> = {
    ORDZHONIKIDZEVSKY: 'ekb-ordzhonikidzevsky',
    ZHELEZNODOROZHNY: 'ekb-zheleznodorozhny',
    VERKH_ISETSKY: 'ekb-verkh-isetsky',
    KIROVSKY: 'ekb-kirovsky',
    LENINSKY: 'ekb-leninsky',
    OKTYABRSKY: 'ekb-oktyabrsky',
    CHKALOVSKY: 'ekb-chkalovsky',
    VIZ: 'ekb-viz',
    AKADEMICHESKY: 'ekb-akademichesky',
    SOLNECHNY: 'ekb-solnechny',
    UKTUS: 'ekb-uktus',
    VERKHNYAYA_PYSHMA: 'vpy-city',
    PERVOURALSK: 'perv-city',
    BEREZOVSKY: 'ber-city',
    ARAMIL: 'ara-city',
    UNKNOWN: 'ekb-unknown',
  };
  return d2z[district] ?? 'ekb-unknown';
}

/** @deprecated Use ekbZoneIdFromLegacyDistrict */
export function chiangMaiZoneIdFromLegacyDistrict(
  district: DistrictKey | '',
  _isMueangCentral: boolean
): string {
  return ekbZoneIdFromLegacyDistrict(district);
}

/**
 * When zone has postal allowlists and we inferred a postcode, it must match.
 */
export function isInferredPostcodeAllowedForZone(
  inferredPostal: string | null,
  zone: DeliveryZoneDef | undefined
): boolean {
  if (!inferredPostal || !zone) return true;
  const { postalCodes, postalPrefixes } = zone;
  if (!postalCodes?.length && !postalPrefixes?.length) return true;
  const inCodes = postalCodes?.includes(inferredPostal) ?? false;
  const inPrefix =
    postalPrefixes?.some((p) => inferredPostal.startsWith(p.replace(/\D/g, ''))) ?? false;
  return inCodes || inPrefix;
}
