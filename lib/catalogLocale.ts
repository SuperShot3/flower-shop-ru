import type { Locale } from '@/lib/i18n';

export function catalogLocalizedName(
  item: { nameEn: string; nameRu?: string | null },
  lang: Locale
): string {
  if (lang === 'ru' && item.nameRu?.trim()) return item.nameRu.trim();
  return item.nameEn;
}

export function catalogLocalizedDescription(
  item: { descriptionEn?: string | null; descriptionRu?: string | null },
  lang: Locale
): string {
  const en = item.descriptionEn?.trim();
  const ru = item.descriptionRu?.trim();
  if (lang === 'ru' && ru) return ru;
  return en || ru || '';
}

export function catalogLocalizedComposition(
  item: { compositionEn?: string | null; compositionRu?: string | null },
  lang: Locale
): string {
  const en = item.compositionEn?.trim();
  const ru = item.compositionRu?.trim();
  if (lang === 'ru' && ru) return ru;
  return en || ru || '';
}

export function catalogSlugColumn(lang: Locale): 'slug_ru' | 'slug_en' {
  return lang === 'ru' ? 'slug_ru' : 'slug_en';
}
