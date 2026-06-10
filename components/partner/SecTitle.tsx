'use client';

import { isThaiLocale, type Locale } from '@/lib/i18n';

type SecTitleProps = {
  th: string;
  en: string;
  lang: Locale;
};

export function SecTitle({ th, en, lang }: SecTitleProps) {
  return (
    <div className="partner-sec-title">
      <div className="partner-sec-title-th">{isThaiLocale(lang) ? th : en}</div>
    </div>
  );
}
