import Link from 'next/link';
import type { ArticleCtaLink } from '../_data/articles';
import styles from './article.module.css';

export function ArticleCta({
  links,
  lang,
}: {
  links: ArticleCtaLink[];
  lang: string;
}) {
  return (
    <section className={styles.infoArticleCta} aria-labelledby="info-article-cta-title">
      <h2 id="info-article-cta-title" className={styles.infoArticleCtaTitle}>
        {lang === 'ru'
          ? 'Заказать или выбрать букет'
          : 'Order or browse'}
      </h2>
      <div className={styles.infoArticleCtaLinks}>
        {links.map((link, i) => {
          const label =
            lang === 'ru' || lang === 'ru' ? link.labelRu : link.label;
          const href = `/${lang}${link.href}`;
          const isPrimary = i === 0;
          return (
            <Link
              key={link.href + link.label}
              href={href}
              className={`${styles.infoArticleCtaLink} ${!isPrimary ? styles.infoArticleCtaLinkSecondary : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
