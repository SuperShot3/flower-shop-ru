/**
 * Articles registry for the Guides / Info section.
 * Each article maps to a slug and usually MDX files:
 * - content/info/[slug].en.mdx (English)
 *
 * Entries with `externalPath` skip MDX and redirect `/info/{slug}` to `/{locale}{externalPath}`.
 */

/** CTA link shown at bottom of article. href is path without lang (e.g. /catalog, /catalog?category=roses) */
export type ArticleCtaLink = {
  label: string;
  labelRu: string;
  href: string;
};

export type ArticleMeta = {
  slug: string;
  title: string;
  excerpt: string;
  /** Russian title (optional; falls back to title if missing) */
  titleRu?: string;
  /** Russian excerpt (optional; falls back to excerpt if missing) */
  excerptRu?: string;
  /**
   * If set, the info hub card links to `/{locale}{externalPath}` (e.g. guide route).
   * The `/info/{slug}` page redirects there; no MDX file is required for this slug.
   */
  externalPath?: string;
  publishedAt: string; // ISO date
  featured?: boolean;
  /** CTA links at bottom of article. If empty, default "Browse bouquets" link is shown. */
  ctaLinks?: ArticleCtaLink[];
  cover:
    | {
        type: 'gradient';
        gradientCss: string;
        center: { kind: 'emoji' | 'icon' | 'text'; value: string };
      }
    | { type: 'image'; src: string; alt: string };
};

export const articles: ArticleMeta[] = [
  {
    slug: 'plush-toys-teddy-bears-chiang-mai',
    title: 'Plush Toys and Teddy Bears Now Available at Lanna Bloom in Chiang Mai',
    excerpt:
      'Add a teddy bear or plush toy to selected flower orders in Chiang Mai—an easy way to make bouquets feel warmer, more personal, and more complete for birthdays, romance, get-well wishes, and long-distance gifts.',
    publishedAt: '2026-04-10T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss:
        'linear-gradient(135deg, #fff8f5 0%, #fce4ec 45%, #e8eaf6 100%)',
      center: { kind: 'emoji', value: '🧸' },
    },
    ctaLinks: [
      { label: 'Browse bouquets', labelRu: 'Смотреть букеты', href: '/catalog' },
      { label: 'Contact us', labelRu: 'Связаться с нами', href: '/contact' },
    ],
  },
  {
    slug: 'birthday-flower-gift-guide',
    title: 'Birthday Flower Gift Guide: Four Luxury Bouquets to Shop Now',
    excerpt:
      'Find a memorable birthday flower gift: compare four luxury bouquets—bold sunset, vivid citrus, timeless roses and lilies, romantic ruby—then shop online from each section.',
    externalPath: '/info/birthday-flower-gift',
    publishedAt: '2026-04-30T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #fff5f7 0%, #fce7f3 45%, #fef3c7 100%)',
      center: { kind: 'emoji', value: '🎂' },
    },
    ctaLinks: [
      { label: 'Browse birthday flowers', labelRu: 'Букеты на день рождения', href: '/catalog?occasion=birthday' },
      { label: 'Browse bouquets', labelRu: 'Смотреть букеты', href: '/catalog' },
    ],
  },
  {
    slug: 'birthday-flowers-chiang-mai-from-abroad',
    title: 'Send Flowers to Chiang Mai From Abroad: What to Expect',
    excerpt:
      'Ordering from another country should feel thoughtful, not stressful. Here is what overseas customers can expect when sending flowers to Chiang Mai: clear steps, secure checkout, and local delivery handled with care.',
    publishedAt: '2026-04-03T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #fff5f7 0%, #f0e6ff 50%, #e8f4fc 100%)',
      center: { kind: 'emoji', value: '🎂' },
    },
    ctaLinks: [
      { label: 'Browse bouquets', labelRu: 'Смотреть букеты', href: '/catalog' },
      { label: 'Delivery policy', labelRu: 'Правила доставки', href: '/info/delivery-policy' },
    ],
  },
  {
    slug: 'how-to-order-flower-delivery-yekaterinburg',
    title: 'How to Order Flower Delivery in Yekaterinburg',
    excerpt:
      'Place an order on our website, enter delivery details and a Yandex Maps link, then we confirm payment with you. Delivery across Yekaterinburg 09:00–20:00; orders after 18:00 usually move to the next day.',
    titleRu: 'Как заказать доставку цветов в Екатеринбурге',
    excerptRu:
      'Оформите заказ на сайте, укажите адрес и ссылку Яндекс Карт — мы подтвердим оплату с вами. Доставка по Екатеринбургу 09:00–20:00; заказы после 18:00 обычно на следующий день.',
    publishedAt: '2026-02-17T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #f5e6e8 0%, #e8dfd0 50%, #e8f0ed 100%)',
      center: { kind: 'emoji', value: '🌸' },
    },
    ctaLinks: [
      { label: 'Browse bouquets', labelRu: 'Смотреть букеты', href: '/catalog' },
      { label: 'Contact us', labelRu: 'Связаться с нами', href: '/contact' },
    ],
  },
  {
    slug: 'rose-bouquets-chiang-mai', // URL-friendly, lowercase, hyphens (e.g. birthday-flowers)
    title: 'Rose Bouquets Delivery in Chiang Mai', // English title
    excerpt: 'Order beautiful rose bouquets and have them delivered across Chiang Mai. Same-day delivery during working hours. Message us via LINE or WhatsApp with your choice and delivery details.', // English excerpt (1–2 sentences)
    publishedAt: '2026-02-19T00:00:00.000Z', // ISO date
    featured: false, // true = shown in featured section at top
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #fde2e4 0%, #f8edeb 50%, #e8dfd0 100%)',
      center: { kind: 'emoji', value: '🚕' },
    },
    ctaLinks: [
      { label: 'Browse rose bouquets', labelRu: 'Букеты из роз', href: '/catalog?types=rose' },
      { label: 'Red roses', labelRu: 'Красные розы', href: '/catalog?types=rose&colors=red' },
      { label: 'White roses', labelRu: 'Белые розы', href: '/catalog?types=rose&colors=white' },
      { label: 'Order now', labelRu: 'Заказать', href: '/catalog' },
    ],
  },
  {
    slug: '51-roses-chiang-mai',
    title: '51 Roses Bouquet in Chiang Mai: Statement Rose Gifts',
    excerpt:
      'A 51 roses bouquet is a bold, beautiful choice for anniversaries, proposals, and romantic surprises in Chiang Mai. Compare classic red, soft pink, and red-and-white styles—then open any bouquet to see details and order.',
    publishedAt: '2026-05-04T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss:
        'linear-gradient(135deg, #fff5f5 0%, #fce7f3 40%, #fecdd3 100%)',
      center: { kind: 'emoji', value: '🌹' },
    },
    ctaLinks: [
      { label: '51 red roses', labelRu: '51 красная роза', href: '/catalog/51-red-roses' },
      { label: 'All rose bouquets', labelRu: 'Все букеты из роз', href: '/info/rose-bouquets-chiang-mai' },
      { label: 'Browse the catalog', labelRu: 'Смотреть каталог', href: '/catalog?types=rose' },
    ],
  },
  {
    slug: 'same-day-flower-delivery-chiang-mai',
    title: 'Same-day flower delivery in Chiang Mai',
    excerpt:
      'Need flowers delivered today? Order same-day flower delivery across Chiang Mai. Message us early for the best choice; we deliver during working hours (09:00–20:00).',
    publishedAt: '2026-02-19T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #e8f0ed 0%, #c8d9b8 50%, #a8c494 100%)',
      center: { kind: 'emoji', value: '🚚' },
    },
    ctaLinks: [
      { label: 'Order same-day delivery', labelRu: 'Заказ на сегодня', href: '/catalog' },
      { label: 'Message us to order', labelRu: 'Написать нам', href: '/contact' },
    ],
  },
  {
    slug: 'delivery-policy',
    title: 'Delivery Policy',
    excerpt:
      'How we deliver in Yekaterinburg and nearby cities: service hours 09:00–20:00, same-day guidance (orders after 18:00 usually roll to the next day), zones and fees at checkout, and what we need for a smooth delivery.',
    titleRu: 'Правила доставки',
    excerptRu:
      'Доставка по Екатеринбургу и ближайшим городам: часы 09:00–20:00, доставка в тот же день (заказы после 18:00 обычно на следующий день), зоны и стоимость при оформлении заказа.',
    publishedAt: '2026-02-20T00:00:00.000Z',
    featured: false,
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 50%, #ef9a9a 100%)',
      center: { kind: 'emoji', value: '📧' },
    },
    ctaLinks: [
      { label: 'Browse bouquets', labelRu: 'Смотреть букеты', href: '/catalog' },
      { label: 'Refund / Replacement / Cancellation Policy', labelRu: 'Возврат, замена и отмена', href: '/refund-replacement' },
    ],
  },
  {
    slug: 'flower-delivery-to-hospitals-chiang-mai', // URL-friendly, lowercase, hyphens (e.g. birthday-flowers)
    title: 'How to Deliver Flowers to Hospitals in Chiang Mai', // English title
    excerpt: 'Sending flowers to someone in a hospital? Here’s the easiest way to arrange delivery in Chiang Mai, plus links to major hospitals to confirm addresses and contact numbers.', // English excerpt (1–2 sentences)
    publishedAt: '2026-02-19T00:00:00.000Z', // ISO date
    featured: true, // true = shown in featured section at top
    cover: {
      type: 'gradient',
      gradientCss: 'linear-gradient(135deg, #fff1f2 0%, #f5f3ff 50%, #ecfeff 100%)',
      center: { kind: 'emoji', value: '🏥' },
    },
    ctaLinks: [
      { label: 'Order flowers for delivery', labelRu: 'Заказать доставку', href: '/catalog' },
      { label: 'Contact us', labelRu: 'Связаться с нами', href: '/contact' },
    ],
  },
];

export function getArticleBySlug(slug: string): ArticleMeta | undefined {
  return articles.find((a) => a.slug === slug);
}

/** Get localized title (lang: 'en' | 'ru') */
export function getArticleTitle(article: ArticleMeta, lang: string): string {
  if (lang === 'ru' && article.titleRu) return article.titleRu;
  return article.title;
}

/** Get localized excerpt (lang: 'en' | 'ru') */
export function getArticleExcerpt(article: ArticleMeta, lang: string): string {
  if (lang === 'ru' && article.excerptRu) return article.excerptRu;
  return article.excerpt;
}

const DEFAULT_CTA: ArticleCtaLink[] = [
  { label: 'Browse bouquets', labelRu: 'Смотреть букеты', href: '/catalog' },
  { label: 'Contact us', labelRu: 'Связаться с нами', href: '/contact' },
];

/** Get CTA links for article. Uses article's ctaLinks or default. */
export function getArticleCtaLinks(article: ArticleMeta, lang: string): ArticleCtaLink[] {
  const links = article.ctaLinks?.length ? article.ctaLinks : DEFAULT_CTA;
  return links;
}

export function getFeaturedArticle(): ArticleMeta {
  const featured = articles.find((a) => a.featured);
  return featured ?? articles[0];
}

export function getMoreGuides(excludeSlug?: string): ArticleMeta[] {
  const filtered = articles.filter((a) => a.slug !== excludeSlug);
  return [...filtered].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
