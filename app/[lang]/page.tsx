import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { HomeRevealInit } from '@/components/home/HomeRevealInit';
import { PopularSection } from '@/components/PopularSection';
import { PopularSectionSkeleton } from '@/components/PopularSectionSkeleton';
import { ExperienceSection } from '@/components/ExperienceSection';
import { PartnersCarousel } from '@/components/PartnersCarousel';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { getCatalogHeroImage, getCatalogHeroCarouselImages } from '@/lib/catalogReads';
import { getBaseUrl } from '@/lib/orders';
import {isValidLocale, defaultLocale, locales, type Locale, getBrandName} from '@/lib/i18n';
import { Suspense } from 'react';

/** Regenerate every 60s so popular catalog items shuffle on each update */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  if (!isValidLocale(params.lang)) return {};
  const base = getBaseUrl();
  const canonical = `${base}/${params.lang}`;
  if (params.lang === 'ru') {
    return {
      title: 'Ланна Блум | Доставка цветов в Екатеринбурге',
      description:
        'Премиальная доставка цветов в Екатеринбурге. Закажите свежие букеты онлайн — доставка сегодня в рабочие часы.',
      alternates: { canonical },
    };
  }
  return {
    title: `${getBrandName('en')} | Flower delivery in Yekaterinburg`,
    description:
      'Premium flower delivery in Yekaterinburg. Order fresh bouquets online — same-day delivery during working hours.',
    alternates: { canonical },
  };
}

export default async function HomePage({
  params,
}: {
  params: { lang: string };
}) {
  const lang = isValidLocale(params.lang) ? params.lang : defaultLocale;
  const [heroImageUrl, carouselImages] = await Promise.all([
    getCatalogHeroImage(),
    getCatalogHeroCarouselImages(),
  ]);
  return (
    <>
      <Hero lang={lang as Locale} heroImageUrl={heroImageUrl} carouselImages={carouselImages} />
      <HomeRevealInit />
      <Suspense fallback={<PopularSectionSkeleton />}>
        <PopularSection lang={lang as Locale} />
      </Suspense>
      <ExperienceSection lang={lang as Locale} />
      <Suspense fallback={null}>
        <PartnersCarousel lang={lang as Locale} />
      </Suspense>
      <ReviewsSection lang={lang as Locale} />
    </>
  );
}
