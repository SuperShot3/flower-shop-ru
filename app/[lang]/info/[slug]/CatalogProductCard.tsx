import { isThaiLocale, type Locale } from '@/lib/i18n'
import { catalogLocalizedName } from '@/lib/catalogLocale';
import Link from 'next/link';
import Image from 'next/image';
import { BouquetCard } from '@/components/BouquetCard';
import { ProductCard } from '@/components/ProductCard';
import {
  getCatalogBalloonBySlug,
  getCatalogBouquetBySlug,
  getCatalogPlushyToyBySlug,
  getCatalogProductBySlug,
} from '@/lib/catalogReads';
import styles from './article.module.css';

export async function CatalogProductCard({
  slug,
  lang,
  variant = 'default',
}: {
  slug: string;
  lang: Locale;
  variant?: 'default' | 'article-catalog-button';
}) {
  const trimmed = (slug || '').trim();
  if (!trimmed) return null;

  const viewLabel = isThaiLocale(lang) ? 'ดูในแคตตาล็อก' : 'View in catalog';
  const href = `/${lang}/catalog/${encodeURIComponent(trimmed)}`;

  // Prefer standalone catalog documents first, then fall back to partner products.
  const product =
    (await getCatalogPlushyToyBySlug(trimmed)) ??
    (await getCatalogBalloonBySlug(trimmed)) ??
    (await getCatalogProductBySlug(trimmed));
  if (product) {
    if (variant === 'article-catalog-button') {
      const name = catalogLocalizedName(product, lang);
      const imgSrc = product.images?.[0] ?? '';
      const imgAlt = product.imageAlts?.[0]?.trim() || name;
      const isDataUrl = typeof imgSrc === 'string' && imgSrc.startsWith('data:');
      return (
        <div className={styles.inlineCatalogMini}>
          <div className={styles.inlineCatalogMiniLeft}>
            <div className={styles.inlineCatalogMiniThumb} aria-hidden>
              {imgSrc ? (
                <Image
                  src={imgSrc}
                  alt={imgAlt}
                  fill
                  sizes="168px"
                  className={styles.inlineCatalogMiniThumbImg}
                  unoptimized={isDataUrl || imgSrc.includes('supabase.co')}
                  draggable={false}
                />
              ) : (
                <div className={styles.inlineCatalogMiniThumbPlaceholder} />
              )}
            </div>
            <div className={styles.inlineCatalogMiniTitle}>{name}</div>
          </div>
          <Link href={href} className={styles.inlineCatalogMiniButton}>
            {viewLabel}
          </Link>
        </div>
      );
    }
    return (
      <div className={styles.inlineCatalogCard}>
        <ProductCard product={product} lang={lang} />
      </div>
    );
  }

  const bouquet = await getCatalogBouquetBySlug(trimmed);
  if (bouquet) {
    if (variant === 'article-catalog-button') {
      const name = catalogLocalizedName(bouquet, lang);
      const imgSrc = bouquet.images?.[0] ?? '';
      const imgAlt = bouquet.imageAlts?.[0]?.trim() || name;
      const isDataUrl = typeof imgSrc === 'string' && imgSrc.startsWith('data:');
      return (
        <div className={styles.inlineCatalogMini}>
          <div className={styles.inlineCatalogMiniLeft}>
            <div className={styles.inlineCatalogMiniThumb} aria-hidden>
              {imgSrc ? (
                <Image
                  src={imgSrc}
                  alt={imgAlt}
                  fill
                  sizes="168px"
                  className={styles.inlineCatalogMiniThumbImg}
                  unoptimized={isDataUrl || imgSrc.includes('supabase.co')}
                  draggable={false}
                />
              ) : (
                <div className={styles.inlineCatalogMiniThumbPlaceholder} />
              )}
            </div>
            <div className={styles.inlineCatalogMiniTitle}>{name}</div>
          </div>
          <Link href={href} className={styles.inlineCatalogMiniButton}>
            {viewLabel}
          </Link>
        </div>
      );
    }
    return (
      <div className={styles.inlineCatalogCard}>
        <BouquetCard bouquet={bouquet} lang={lang} />
      </div>
    );
  }

  return null;
}

