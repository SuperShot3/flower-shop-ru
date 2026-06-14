'use client';

import { type Locale } from '@/lib/i18n';

type SecTitleProps = {
  ru: string;
  en: string;
  lang: Locale;
};

export function SecTitle({ ru, en, lang }: SecTitleProps) {
  return (
    <div className="partner-sec-title">
      <div className="partner-sec-title-th">{lang === 'ru' ? ru : en}</div>
    </div>
  );
}
