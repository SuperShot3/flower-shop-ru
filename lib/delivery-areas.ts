/**
 * Yekaterinburg service area — districts and nearby cities.
 */

/** Shop address — reference only; not used for real distance in v1. */
export const SHOP_ADDRESS =
  'Екатеринбург, Свердловская область';

export const PREP_MINUTES = 30;

export type DeliveryTier = 'near' | 'mid' | 'far';
export type DeliveryType = 'standard' | 'priority';

/** Estimate grouping by distance from shop (v1 — manual fees in zones.ts). */
const NEAR_IDS = new Set<string>(['ordzhonikidzevsky', 'zheleznodorozhny']);
const FAR_IDS = new Set<string>(['pervouralsk', 'aramil']);

export interface District {
  id: string;
  nameEn: string;
  nameRu: string;
}

export function getDeliveryTier(district: District): DeliveryTier {
  if (NEAR_IDS.has(district.id)) return 'near';
  if (FAR_IDS.has(district.id)) return 'far';
  return 'mid';
}

export function getTotalTimeRangeMinutes(
  tier: DeliveryTier,
  deliveryType: DeliveryType
): { minTotal: number; maxTotal: number } {
  if (tier === 'near') {
    return deliveryType === 'standard' ? { minTotal: 45, maxTotal: 55 } : { minTotal: 55, maxTotal: 70 };
  }
  if (tier === 'mid') {
    return deliveryType === 'standard' ? { minTotal: 60, maxTotal: 80 } : { minTotal: 65, maxTotal: 85 };
  }
  return deliveryType === 'standard' ? { minTotal: 100, maxTotal: 125 } : { minTotal: 90, maxTotal: 110 };
}

export const CITY_EN = 'Yekaterinburg';
export const CITY_RU = 'Екатеринбург';

/** @deprecated Use CITY_RU */
export const CITY_TH = CITY_RU;

/** Eight official administrative districts of Yekaterinburg + popular micro-districts. */
export const EKB_DISTRICTS: District[] = [
  { id: 'ordzhonikidzevsky', nameEn: 'Ordzhonikidzevsky', nameRu: 'Орджоникидзевский' },
  { id: 'zheleznodorozhny', nameEn: 'Zheleznodorozhny', nameRu: 'Железнодорожный' },
  { id: 'verkh-isetsky', nameEn: 'Verkh-Isetsky', nameRu: 'Верх-Исетский' },
  { id: 'kirovsky', nameEn: 'Kirovsky', nameRu: 'Кировский' },
  { id: 'leninsky', nameEn: 'Leninsky', nameRu: 'Ленинский' },
  { id: 'oktyabrsky', nameEn: 'Oktyabrsky', nameRu: 'Октябрьский' },
  { id: 'chkalovsky', nameEn: 'Chkalovsky', nameRu: 'Чкаловский' },
  { id: 'akademichesky', nameEn: 'Akademichesky', nameRu: 'Академический' },
  { id: 'viz', nameEn: 'VIZ', nameRu: 'ВИЗ' },
  { id: 'solnechny', nameEn: 'Solnechny', nameRu: 'Солнечный' },
  { id: 'uktus', nameEn: 'Uktus', nameRu: 'Уктус' },
];

/** @deprecated Use EKB_DISTRICTS */
export const CHIANG_MAI_DISTRICTS = EKB_DISTRICTS;
