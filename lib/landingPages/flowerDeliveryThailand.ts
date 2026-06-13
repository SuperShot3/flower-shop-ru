import { isThaiLocale, type Locale } from '@/lib/i18n';
import { MARKETS } from '@/lib/delivery/markets';

export type ThailandServiceArea = {
  nameEn: string;
  nameRu: string;
  href: (lang: Locale) => string;
  noteEn?: string;
  noteTh?: string;
};

export function getThailandServiceAreas(): ThailandServiceArea[] {
  return [
    {
      nameEn: 'Yekaterinburg',
      nameRu: 'Екатеринбург',
      href: (lang) => `/${lang}/catalog`,
      noteEn: 'Full flower & gift catalog · same-day when available',
      noteTh: 'Полный каталог · доставка сегодня по возможности',
    },
    ...MARKETS.map((m) => ({
      nameEn: m.customerFacingNameEn,
      nameRu: m.customerFacingNameRu,
      href: (lang: Locale) => `/${lang}/${m.pathSlug}/flower-delivery`,
      noteEn: 'Bouquet delivery',
      noteTh: 'Доставка букетов',
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

const COPY: Record<'en' | 'th', FlowerDeliveryThailandCopy> = {
  en: {
    metaTitle: 'Flower Delivery in Thailand | Lanna Bloom',
    metaDescription:
      'Order flowers online with Lanna Bloom. Primary delivery in Chiang Mai; bouquet delivery in Phuket, Hua Hin, Koh Samui, Krabi & Ao Nang, and Pattaya.',
    h1: 'Flower delivery in Thailand',
    intro:
      'Lanna Bloom is a Chiang Mai flower and gift delivery service. Order online with secure checkout — we deliver in Chiang Mai and selected destinations across Thailand, with more areas planned.',
    areasTitle: 'Where we deliver',
    expandingNote:
      'We are expanding carefully. Nationwide delivery is not available yet — only the areas listed below.',
    ctaCatalog: 'Shop Chiang Mai',
    ctaChiangMaiGuide: 'Chiang Mai delivery guide',
    ctaDeliveryPolicy: 'Delivery policy',
  },
  th: {
    metaTitle: 'ส่งดอกไม้ทั่วประเทศไทย | Lanna Bloom',
    metaDescription:
      'สั่งดอกไม้ออนไลน์กับ Lanna Bloom จัดส่งหลักในเชียงใหม่ และจัดส่งช่อดอกไม้ในภูเก็ต หัวหิน เกาะสมุย กระบี่และอ่าวนาง และพัทยา',
    h1: 'บริการส่งดอกไม้ในประเทศไทย',
    intro:
      'Lanna Bloom ให้บริการส่งดอกไม้และของขวัญในเชียงใหม่ สั่งซื้อออนไลน์ชำระเงินปลอดภัย — เราจัดส่งในเชียงใหม่และจุดหมายที่เลือกทั่วประเทศไทย และจะขยายพื้นที่เพิ่มเติมต่อไป',
    areasTitle: 'พื้นที่ที่ให้บริการ',
    expandingNote:
      'เราขยายพื้นที่อย่างรอบคอบ ยังไม่มีบริการทั่วทั้งประเทศ — เฉพาะพื้นที่ที่ระบุด้านล่างเท่านั้น',
    ctaCatalog: 'เลือกซื้อเชียงใหม่',
    ctaChiangMaiGuide: 'คู่มือจัดส่งเชียงใหม่',
    ctaDeliveryPolicy: 'นโยบายการจัดส่ง',
  },
};

export function getFlowerDeliveryThailandCopy(lang: Locale): FlowerDeliveryThailandCopy {
  if (isThaiLocale(lang)) return COPY.th;
  return COPY.en;
}
