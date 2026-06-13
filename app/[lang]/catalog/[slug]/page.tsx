import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBaseUrl } from '@/lib/orders';
import { buildBouquetProductJsonLd } from '@/lib/seo/productJsonLd';
import { ProductPageClient } from './ProductPageClient';
import { ProductDetailClient } from './ProductDetailClient';
import {
  getCatalogBalloonBySlug,
  getCatalogBouquetBySlug,
  getCatalogBouquets,
  getCatalogPlushyToyBySlug,
  getCatalogPopularBouquets,
  getCatalogProductBySlug,
  getCatalogProductsFiltered,
} from '@/lib/catalogReads';
import { isDatabaseConfigured } from '@/lib/db/client';
import {isValidLocale, locales, type Locale, isThaiLocale} from '@/lib/i18n'
import { catalogLocalizedComposition, catalogLocalizedDescription, catalogLocalizedName } from '@/lib/catalogLocale';
import { translations } from '@/lib/i18n';
import { getMarketByPathSlug } from '@/lib/delivery/markets';
import MarketCatalogPageViaSlug from './catalog/page';
import { getReviewStatsAsync } from '@/lib/reviews';

// Revalidate product pages every 60 seconds so catalog updates appear without rebuild
export const revalidate = 60;

export async function generateStaticParams() {
  if (!isDatabaseConfigured()) return [];
  const bouquets = await getCatalogBouquets();
  return locales.flatMap((lang) =>
    bouquets.map((b) => ({ lang, slug: b.slug }))
  );
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { lang: string; slug: string };
}): Promise<Metadata> {
  if (!isValidLocale(params.lang)) return {};
  if (getMarketByPathSlug(params.slug)) return {};

  const bouquet = await getCatalogBouquetBySlug(params.slug);
  if (!bouquet) return {};

  const isTh = isThaiLocale(params.lang);
  const name = isTh ? bouquet.nameRu : bouquet.nameEn;
  const title =
    (isTh ? bouquet.seoTitleRu : bouquet.seoTitleEn)?.trim() ||
    `${name} | Flower delivery Chiang Mai | Lanna Bloom`;
  const description =
    (isTh ? bouquet.seoDescriptionRu : bouquet.seoDescriptionEn)?.trim() ||
    (isTh ? bouquet.descriptionRu : bouquet.descriptionEn).trim().slice(0, 160) ||
    (isTh
      ? `สั่ง${name} พร้อมจัดส่งในเชียงใหม่`
      : `Order ${name} with flower delivery in Chiang Mai.`);

  const canonical = `${getBaseUrl()}/${params.lang}/catalog/${bouquet.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { lang: string; slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const lang = params.lang;
  if (!isValidLocale(lang)) notFound();
  const market = getMarketByPathSlug(params.slug);
  if (market) {
    return MarketCatalogPageViaSlug({ params, searchParams });
  }

  const bouquet = await getCatalogBouquetBySlug(params.slug);
  if (bouquet) {
    const reviewStats = await getReviewStatsAsync();
    const gifts = await getCatalogProductsFiltered({ categoryKey: 'gifts' });
    const name = catalogLocalizedName(bouquet, lang);
    const description = catalogLocalizedDescription(bouquet, lang as Locale);
    const composition = catalogLocalizedComposition(bouquet, lang as Locale);
    const t = translations[lang as Locale].product;
    const nav = translations[lang as Locale].nav;
    const catalogHref = `/${lang}/catalog`;
    const pageUrl = `${getBaseUrl()}/${lang}/catalog/${bouquet.slug}`;
    const productJsonLd = buildBouquetProductJsonLd(
      bouquet,
      lang as Locale,
      pageUrl
    );

    return (
      <div className="product-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <div className="container product-layout">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href={`/${lang}`}>{nav.home}</Link>
            <span className="sep">/</span>
            <Link href={catalogHref}>{nav.catalog}</Link>
            <span className="sep">/</span>
            <span aria-current="page">{name}</span>
          </nav>
          <div className="product-grid">
            <ProductPageClient
              bouquet={bouquet}
              lang={lang as Locale}
              name={name}
              description={description}
              compositionHeading={t.composition}
              compositionText={composition}
              reviewAverage={reviewStats.average}
              reviewCount={reviewStats.count}
              gifts={gifts}
            />
          </div>
        </div>
      </div>
    );
  }

  const plushyToy = await getCatalogPlushyToyBySlug(params.slug);
  if (plushyToy) {
    const name = catalogLocalizedName(plushyToy, lang);
    const description = (isThaiLocale(lang) ? plushyToy.descriptionRu : plushyToy.descriptionEn) || '';
    const nav = translations[lang as Locale].nav;
    const catalogHref = `/${lang}/catalog`;
    const suggestedBouquets = await getCatalogPopularBouquets(8);

    return (
      <div className="product-page">
        <div className="container product-layout">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href={`/${lang}`}>{nav.home}</Link>
            <span className="sep">/</span>
            <Link href={catalogHref}>{nav.catalog}</Link>
            <span className="sep">/</span>
            <span aria-current="page">{name}</span>
          </nav>
          <div className="product-grid">
            <ProductDetailClient
              product={plushyToy}
              lang={lang as Locale}
              name={name}
              description={description}
              gifts={[]}
              suggestedBouquets={suggestedBouquets}
            />
          </div>
        </div>
      </div>
    );
  }

  const balloon = await getCatalogBalloonBySlug(params.slug);
  if (balloon) {
    const name = catalogLocalizedName(balloon, lang);
    const description = (isThaiLocale(lang) ? balloon.descriptionRu : balloon.descriptionEn) || '';
    const nav = translations[lang as Locale].nav;
    const catalogHref = `/${lang}/catalog?topCategory=balloons`;
    const suggestedBouquets = await getCatalogPopularBouquets(8);

    return (
      <div className="product-page">
        <div className="container product-layout">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href={`/${lang}`}>{nav.home}</Link>
            <span className="sep">/</span>
            <Link href={catalogHref}>{nav.catalog}</Link>
            <span className="sep">/</span>
            <span aria-current="page">{name}</span>
          </nav>
          <div className="product-grid">
            <ProductDetailClient
              product={balloon}
              lang={lang as Locale}
              name={name}
              description={description}
              gifts={[]}
              suggestedBouquets={suggestedBouquets}
            />
          </div>
        </div>
      </div>
    );
  }

  const product = await getCatalogProductBySlug(params.slug);
  if (product) {
    const gifts = await getCatalogProductsFiltered({ categoryKey: 'gifts' });
    const name = catalogLocalizedName(product, lang);
    const description = (isThaiLocale(lang) ? product.descriptionRu : product.descriptionEn) || '';
    const nav = translations[lang as Locale].nav;
    const catalogHref = `/${lang}/catalog`;

    return (
      <div className="product-page">
        <div className="container product-layout">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href={`/${lang}`}>{nav.home}</Link>
            <span className="sep">/</span>
            <Link href={catalogHref}>{nav.catalog}</Link>
            <span className="sep">/</span>
            <span aria-current="page">{name}</span>
          </nav>
          <div className="product-grid">
            <ProductDetailClient
              product={product}
              lang={lang as Locale}
              name={name}
              description={description}
              gifts={gifts}
            />
          </div>
        </div>
      </div>
    );
  }

  notFound();
}
