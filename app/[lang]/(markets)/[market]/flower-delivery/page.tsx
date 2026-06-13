import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {isValidLocale, type Locale, isThaiLocale} from '@/lib/i18n';
import { getMarketByPathSlug } from '@/lib/delivery/markets';
import {
  getCatalogBouquetsPaginated,
  getCatalogHeroImage,
  getCatalogHeroCarouselImages,
} from '@/lib/catalogReads';
import { Hero } from '@/components/Hero';
import { MarketBouquetsShowcase } from '@/components/MarketBouquetsShowcase';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { lang: string; market: string };
}): Promise<Metadata> {
  const m = getMarketByPathSlug(params.market);
  if (!m) return {};
  const isTh = isThaiLocale(params.lang);
  const place =
    params.lang === 'ru'
      ? m.customerFacingNameRu
      : isTh
        ? m.customerFacingNameRu
        : m.customerFacingNameEn;
  const title =
    params.lang === 'ru'
      ? `Доставка цветов — ${place} | Lanna Bloom`
      : isTh
        ? `ส่งดอกไม้ ${place} | Lanna Bloom`
        : `Flower delivery ${place} | Lanna Bloom`;
  const bouquetOnly = isTh ? ' (ช่อดอกไม้เท่านั้น)' : ' (bouquet delivery only)';
  const description = isTh
    ? `ช่อดอกไม้สด จัดส่ง${place}${bouquetOnly} เลือกช่อออนไลน์ ชำระเงินปลอดภัย`
    : `Fresh flower bouquets delivered in ${place}${bouquetOnly}. Order online with secure checkout.`;
  return { title, description };
}

export default async function MarketFlowerDeliveryPage({
  params,
}: {
  params: { lang: string; market: string };
}) {
  if (!isValidLocale(params.lang)) notFound();
  const entry = getMarketByPathSlug(params.market);
  if (!entry) notFound();

  const lang = params.lang as Locale;
  const [initialBouquets, heroImageUrl, carouselImages] = await Promise.all([
    getCatalogBouquetsPaginated(0, 12, entry.destinationId),
    getCatalogHeroImage(),
    getCatalogHeroCarouselImages(),
  ]);

  const isTh = isThaiLocale(lang);
  const marketH1 =
    lang === 'ru'
      ? `Доставка цветов — ${entry.customerFacingNameRu}`
      : isTh
        ? `Доставка цветов — ${entry.customerFacingNameRu}`
        : `${entry.customerFacingNameEn} flower delivery`;

  return (
    <div className="market-flower-delivery-page">
      <Hero
        lang={lang}
        heroImageUrl={heroImageUrl}
        carouselImages={carouselImages}
        titleOverride={marketH1}
        browseCollectionHref="#bouquets"
      />
      <div id="bouquets">
        <MarketBouquetsShowcase
          lang={lang}
          catalogDestination={entry.destinationId}
          initialBouquets={initialBouquets}
        />
      </div>
    </div>
  );
}
