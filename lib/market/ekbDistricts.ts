/** Yekaterinburg districts for partner CRM and delivery filtering. */

export const EKB_DISTRICTS = [
  { value: '', labelRu: 'Выберите район…', labelEn: 'Select district…' },
  { value: 'verkh_isetsky', labelRu: 'Верх-Исетский', labelEn: 'Verkh-Isetsky' },
  { value: 'zheleznodorozhny', labelRu: 'Железнодорожный', labelEn: 'Zheleznodorozhny' },
  { value: 'kirovsky', labelRu: 'Кировский', labelEn: 'Kirovsky' },
  { value: 'leninsky', labelRu: 'Ленинский', labelEn: 'Leninsky' },
  { value: 'oktyabrsky', labelRu: 'Октябрьский', labelEn: 'Oktyabrsky' },
  { value: 'ordzhonikidzevsky', labelRu: 'Орджоникидзевский', labelEn: 'Ordzhonikidzevsky' },
  { value: 'chkalovsky', labelRu: 'Чкаловский', labelEn: 'Chkalovsky' },
  { value: 'akademichesky', labelRu: 'Академический', labelEn: 'Akademichesky' },
  { value: 'viz', labelRu: 'ВИЗ', labelEn: 'VIZ' },
  { value: 'solnechny', labelRu: 'Солнечный', labelEn: 'Solnechny' },
  { value: 'uktus', labelRu: 'Уктус', labelEn: 'Uktus' },
  { value: 'other', labelRu: 'Другой / за городом', labelEn: 'Other / outskirts' },
] as const;

export type EkbDistrictValue = (typeof EKB_DISTRICTS)[number]['value'];

/** District chips for admin list filter (excludes empty placeholder). */
export const EKB_DISTRICT_FILTER_OPTIONS = EKB_DISTRICTS.filter((d) => d.value !== '');

export function ekbDistrictLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const found = EKB_DISTRICTS.find((d) => d.value === value);
  return found?.labelRu ?? value;
}
