/** Partner portal constants — districts, categories, prep times, occasions */

import { EKB_DISTRICTS } from '@/lib/market/ekbDistricts';

export const DISTRICTS = EKB_DISTRICTS;

export const CATEGORY_OPTIONS = [
  { value: 'flowers', labelRu: 'Цветы', labelEn: 'Flowers', icon: '💐' },
  { value: 'balloons', labelRu: 'Шары', labelEn: 'Balloons', icon: '🎈' },
  { value: 'gifts', labelRu: 'Подарки и наборы', labelEn: 'Gifts & Sets', icon: '🎁' },
  { value: 'money_flowers', labelRu: 'Денежные букеты', labelEn: 'Money Flowers', icon: '💵' },
  { value: 'handmade_floral', labelRu: 'Флористика ручной работы', labelEn: 'Handmade Floral', icon: '🌿' },
  { value: 'food_sweets', labelRu: 'Торты и сладости', labelEn: 'Food & Sweets', icon: '🍓' },
  { value: 'wellness', labelRu: 'Здоровье и релакс', labelEn: 'Wellness', icon: '🕯️' },
  { value: 'plushy_toys', labelRu: 'Игрушки и мягкие', labelEn: 'Toys & Plush', icon: '🧸' },
  { value: 'home_lifestyle', labelRu: 'Дом и лайфстайл', labelEn: 'Home & Lifestyle', icon: '☕' },
  { value: 'stationery', labelRu: 'Канцелярия', labelEn: 'Stationery', icon: '📖' },
  { value: 'baby_family', labelRu: 'Дети и семья', labelEn: 'Baby & Family', icon: '👶' },
  { value: 'fashion', labelRu: 'Мода и аксессуары', labelEn: 'Fashion & Accessories', icon: '👜' },
  { value: 'seasonal', labelRu: 'Сезонное', labelEn: 'Seasonal', icon: '🌿' },
  { value: 'other', labelRu: 'Другое', labelEn: 'Other', icon: '✦' },
] as const;

export type ProductCategory = Exclude<
  (typeof CATEGORY_OPTIONS)[number]['value'],
  'flowers'
>;

export const NON_FLOWER_CATEGORIES: ProductCategory[] = CATEGORY_OPTIONS
  .filter((c) => c.value !== 'flowers')
  .map((c) => c.value as ProductCategory);

/** Common flowers for partner stock checklist (EKB assortment). */
export const FLOWER_STOCK_OPTIONS = [
  { value: 'rose', labelRu: 'Розы' },
  { value: 'gerbera', labelRu: 'Герберы' },
  { value: 'chrysanthemums', labelRu: 'Хризантемы' },
  { value: 'carnation', labelRu: 'Гвоздики' },
  { value: 'tulip', labelRu: 'Тюльпаны' },
  { value: 'lisianthus', labelRu: 'Эустома' },
  { value: 'gypsophila', labelRu: 'Гипсофила' },
  { value: 'lily', labelRu: 'Лилии' },
  { value: 'orchid', labelRu: 'Орхидеи' },
  { value: 'peony', labelRu: 'Пионы' },
  { value: 'sunflower', labelRu: 'Подсолнухи' },
  { value: 'mums', labelRu: 'Хризантемы (мелкие)' },
  { value: 'mixed', labelRu: 'Сборные' },
] as const;

export const PREP_TIME_OPTIONS = [
  { value: '30', labelRu: '30 минут', labelEn: '30 min' },
  { value: '60', labelRu: '1 час', labelEn: '1 hour' },
  { value: '120', labelRu: '2 часа', labelEn: '2 hours' },
  { value: '240', labelRu: '4+ часа', labelEn: '4+ hours' },
  { value: 'made_to_order', labelRu: 'Под заказ', labelEn: 'Made to order' },
] as const;

export const OCCASION_OPTIONS = [
  { value: 'birthday', labelRu: '🎂 День рождения', labelEn: '🎂 Birthday' },
  { value: 'anniversary', labelRu: '💍 Годовщина', labelEn: '💍 Anniversary' },
  { value: 'romantic', labelRu: '💝 Романтика', labelEn: '💝 Romantic' },
  { value: 'get_well', labelRu: '🌿 Выздоровление', labelEn: '🌿 Get well soon' },
  { value: 'congrats', labelRu: '🎉 Поздравление', labelEn: '🎉 Congratulations' },
  { value: 'sympathy', labelRu: '🕊️ Соболезнование', labelEn: '🕊️ Sympathy' },
  { value: 'baby_shower', labelRu: '👶 Рождение ребёнка', labelEn: '👶 Baby shower' },
  { value: 'housewarming', labelRu: '🏠 Новоселье', labelEn: '🏠 Housewarming' },
  { value: 'graduation', labelRu: '🎓 Выпускной', labelEn: '🎓 Graduation' },
  { value: 'just_because', labelRu: '💌 Просто так', labelEn: '💌 Just because' },
] as const;

export function categoryLabelRu(value: string): string {
  const found = CATEGORY_OPTIONS.find((c) => c.value === value);
  return found?.labelRu ?? value;
}

export function flowerStockLabelRu(value: string): string {
  const found = FLOWER_STOCK_OPTIONS.find((f) => f.value === value);
  return found?.labelRu ?? value;
}
