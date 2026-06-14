import { type Locale } from '@/lib/i18n';
import { MARKETS } from '@/lib/delivery/markets';

export type ThailandServiceArea = {
  nameEn: string;
  nameRu: string;
  href: (lang: Locale) => string;
  noteEn?: string;
  noteRu?: string;
};

export function getThailandServiceAreas(): ThailandServiceArea[] {
  return [
    {
      nameEn: 'Yekaterinburg',
      nameRu: 'Екатеринбург',
      href: (lang) => `/${lang}/catalog`,
      noteEn: 'Full flower & gift catalog · same-day when available',
      noteRu: 'Полный каталог · доставка сегодня по возможности',
    },
    ...MARKETS.map((m) => ({
      nameEn: m.customerFacingNameEn,
      nameRu: m.customerFacingNameRu,
      href: (lang: Locale) => `/${lang}/${m.pathSlug}/flower-delivery`,
      noteEn: 'Bouquet delivery',
      noteRu: 'Доставка букетов',
    })),
  ];
}

export type FlowerDeliveryThailandCopy = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  areasTitle: string;
  expandingNote: string;
  ctaCatalog: string;
  ctaChiangMaiGuide: string;
  ctaDeliveryPolicy: string;
};

const COPY: Record<Locale, FlowerDeliveryThailandCopy> = {
  en: {
    metaTitle: 'Flower Delivery in Yekaterinburg | Lanna Bloom',
    metaDescription:
      'Order flowers online with Lanna Bloom. Delivery in Yekaterinburg and nearby cities — Verkhnyaya Pyshma, Pervouralsk, Berezovsky, and Aramil.',
    h1: 'Flower delivery in Yekaterinburg',
    intro:
      'Lanna Bloom delivers flowers and gifts in Yekaterinburg and nearby cities. Order online — we confirm payment with you and deliver locally.',
    areasTitle: 'Where we deliver',
    expandingNote:
      'We deliver across Yekaterinburg districts and selected nearby cities. Confirm your address at checkout.',
    ctaCatalog: 'Browse catalog',
    ctaChiangMaiGuide: 'Delivery guide',
    ctaDeliveryPolicy: 'Delivery policy',
  },
  ru: {
    metaTitle: 'Доставка цветов в Екатеринбурге | Lanna Bloom',
    metaDescription:
      'Закажите цветы онлайн в Lanna Bloom. Доставка по Екатеринбургу и ближайшим городам — Верхняя Пышма, Первоуральск, Берёзовский, Арамиль.',
    h1: 'Доставка цветов в Екатеринбурге',
    intro:
      'Lanna Bloom доставляет цветы и подарки по Екатеринбургу и ближайшим городам. Оформите заказ на сайте — мы подтвердим оплату с вами и доставим.',
    areasTitle: 'Куда доставляем',
    expandingNote:
      'Доставляем по районам Екатеринбурга и в выбранные города области. Адрес уточняется при оформлении заказа.',
    ctaCatalog: 'Смотреть каталог',
    ctaChiangMaiGuide: 'Как заказать',
    ctaDeliveryPolicy: 'Правила доставки',
  },
};

export function getFlowerDeliveryThailandCopy(lang: Locale): FlowerDeliveryThailandCopy {
  return COPY[lang];
}
