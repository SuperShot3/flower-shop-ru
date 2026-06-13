/**
 * District-based delivery fee calculation for Yekaterinburg service area.
 * Server is source of truth; client uses for live preview only.
 * Prefer destination + zone id from lib/delivery/zones.ts for new checkout flows.
 */

/** Internal district keys (stable, used in payload / orders.district). */
export type DistrictKey =
  | 'ORDZHONIKIDZEVSKY'
  | 'ZHELEZNODOROZHNY'
  | 'VERKH_ISETSKY'
  | 'KIROVSKY'
  | 'LENINSKY'
  | 'OKTYABRSKY'
  | 'CHKALOVSKY'
  | 'AKADEMICHESKY'
  | 'VIZ'
  | 'SOLNECHNY'
  | 'UKTUS'
  | 'VERKHNYAYA_PYSHMA'
  | 'PERVOURALSK'
  | 'BEREZOVSKY'
  | 'ARAMIL'
  | 'UNKNOWN';

export interface DistrictOption {
  key: DistrictKey;
  labelEn: string;
  labelRu: string;
}

/** EKB city districts + nearby cities (for legacy dropdowns / admin). */
export const DISTRICTS: DistrictOption[] = [
  { key: 'ORDZHONIKIDZEVSKY', labelEn: 'Ordzhonikidzevsky (Uralmash)', labelRu: 'Орджоникидзевский (Уралмаш)' },
  { key: 'ZHELEZNODOROZHNY', labelEn: 'Zheleznodorozhny', labelRu: 'Железнодорожный' },
  { key: 'VERKH_ISETSKY', labelEn: 'Verkh-Isetsky', labelRu: 'Верх-Исетский' },
  { key: 'KIROVSKY', labelEn: 'Kirovsky', labelRu: 'Кировский' },
  { key: 'LENINSKY', labelEn: 'Leninsky', labelRu: 'Ленинский' },
  { key: 'OKTYABRSKY', labelEn: 'Oktyabrsky', labelRu: 'Октябрьский' },
  { key: 'CHKALOVSKY', labelEn: 'Chkalovsky', labelRu: 'Чкаловский' },
  { key: 'VIZ', labelEn: 'VIZ', labelRu: 'ВИЗ' },
  { key: 'AKADEMICHESKY', labelEn: 'Akademichesky', labelRu: 'Академический' },
  { key: 'SOLNECHNY', labelEn: 'Solnechny', labelRu: 'Солнечный' },
  { key: 'UKTUS', labelEn: 'Uktus', labelRu: 'Уктус' },
  { key: 'VERKHNYAYA_PYSHMA', labelEn: 'Verkhnyaya Pyshma', labelRu: 'Верхняя Пышма' },
  { key: 'PERVOURALSK', labelEn: 'Pervouralsk', labelRu: 'Первоуральск' },
  { key: 'BEREZOVSKY', labelEn: 'Berezovsky', labelRu: 'Берёзовский' },
  { key: 'ARAMIL', labelEn: 'Aramil', labelRu: 'Арамиль' },
  { key: 'UNKNOWN', labelEn: 'Other / Unknown', labelRu: 'Другой / уточним' },
];

export interface CalcDeliveryFeeInput {
  district: DistrictKey;
  /** Legacy Chiang Mai flag — ignored for EKB pricing. */
  isMueangCentral?: boolean;
}

/**
 * Delivery input shape used by cart (address, lat, lng optional).
 */
export interface DeliveryInput {
  address?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryDistrict?: DistrictKey;
  isMueangCentral?: boolean;
}

const FEE_BY_DISTRICT: Record<DistrictKey, number> = {
  ORDZHONIKIDZEVSKY: 300,
  ZHELEZNODOROZHNY: 300,
  VERKH_ISETSKY: 350,
  KIROVSKY: 350,
  LENINSKY: 350,
  OKTYABRSKY: 350,
  CHKALOVSKY: 400,
  VIZ: 400,
  AKADEMICHESKY: 450,
  SOLNECHNY: 450,
  UKTUS: 450,
  VERKHNYAYA_PYSHMA: 400,
  PERVOURALSK: 550,
  BEREZOVSKY: 450,
  ARAMIL: 500,
  UNKNOWN: 500,
};

/**
 * Compute delivery fee in RUB based on district key.
 * Server uses this; never trust client-provided fee.
 */
export function calcDeliveryFeeRUB(input: CalcDeliveryFeeInput): number {
  return FEE_BY_DISTRICT[input.district] ?? 500;
}

/**
 * Get delivery fee in RUB from DeliveryInput (district).
 * Falls back to 500 RUB (unknown) when district not provided.
 */
export function getDeliveryFeeRUB(input?: DeliveryInput): number {
  const district = (input?.deliveryDistrict as DistrictKey) ?? 'UNKNOWN';
  return calcDeliveryFeeRUB({ district });
}

/** Keywords for district detection (lowercase). Order matters: more specific first. */
const DISTRICT_KEYWORDS: { key: DistrictKey; patterns: string[] }[] = [
  {
    key: 'ORDZHONIKIDZEVSKY',
    patterns: ['ordzhonikidzevsky', 'ordzhonikidzevskiy', 'орджоникидзевск', 'уралмаш', 'uralmash'],
  },
  {
    key: 'VERKHNYAYA_PYSHMA',
    patterns: ['verkhnyaya pyshma', 'verhnyaya pyshma', 'верхняя пышма', 'верхней пышм'],
  },
  {
    key: 'PERVOURALSK',
    patterns: ['pervouralsk', 'pervoural\'sk', 'первоуральск'],
  },
  {
    key: 'BEREZOVSKY',
    patterns: ['berezovsky', 'beryozovsky', 'berёzovsky', 'берёзовск', 'berezovskiy'],
  },
  {
    key: 'ARAMIL',
    patterns: ['aramil', 'арамиль'],
  },
  { key: 'VIZ', patterns: [' viz ', ' виз ', 'viz district', 'район виз'] },
  { key: 'UKTUS', patterns: ['uktus', 'уктус'] },
  { key: 'SOLNECHNY', patterns: ['solnechny', 'solnechniy', 'солнечный'] },
  { key: 'AKADEMICHESKY', patterns: ['akademichesky', 'akademicheskiy', 'акademichesk', 'академическ'] },
  { key: 'VERKH_ISETSKY', patterns: ['verkh-isetsky', 'verh-isetsky', 'верх-исетск', 'верхисетск'] },
  { key: 'ZHELEZNODOROZHNY', patterns: ['zheleznodorozhny', 'zheleznodorozhniy', 'железнодорожн'] },
  { key: 'KIROVSKY', patterns: ['kirovsky', 'kirovskiy', 'кировск'] },
  { key: 'LENINSKY', patterns: ['leninsky', 'leninskiy', 'ленинск'] },
  { key: 'OKTYABRSKY', patterns: ['oktyabrsky', 'oktyabrskiy', 'октябрьск'] },
  { key: 'CHKALOVSKY', patterns: ['chkalovsky', 'chkalovskiy', 'чкаловск'] },
  {
    key: 'KIROVSKY',
    patterns: ['екатеринбург', 'yekaterinburg', 'ekaterinburg', 'екб', ' ekb '],
  },
];

/**
 * Auto-detect district from address text.
 * Returns district key or null if no match.
 */
export function detectDistrictFromAddress(addressText: string): DistrictKey | null {
  const normalized = addressText
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalized) return null;

  for (const { key, patterns } of DISTRICT_KEYWORDS) {
    for (const p of patterns) {
      if (normalized.includes(p)) {
        return key;
      }
    }
  }

  return null;
}
