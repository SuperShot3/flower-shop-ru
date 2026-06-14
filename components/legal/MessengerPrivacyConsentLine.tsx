'use client';

import Link from 'next/link';
import { translations, type Locale } from '@/lib/i18n';

export function MessengerPrivacyConsentLine({
  lang,
  className = '',
}: {
  lang: Locale;
  className?: string;
}) {
  const t = translations[lang].messenger;

  return (
    <p className={`messenger-privacy-consent ${className}`.trim()}>
      {t.privacyConsentBefore}{' '}
      <Link href={`/${lang}/privacy`} className="messenger-privacy-consent-link">
        {t.privacyConsentLink}
      </Link>
      {t.privacyConsentAfter}
      <style jsx>{`
        .messenger-privacy-consent {
          margin: 8px 0 0;
          font-size: 10px;
          line-height: 1.35;
          color: var(--text-muted);
          text-align: center;
        }
        .messenger-privacy-consent :global(.messenger-privacy-consent-link) {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
        .messenger-privacy-consent :global(.messenger-privacy-consent-link:hover) {
          text-decoration: underline;
        }
      `}</style>
    </p>
  );
}
