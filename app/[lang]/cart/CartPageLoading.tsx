'use client';

import { usePathname } from 'next/navigation';
import { translations, isValidLocale, type Locale } from '@/lib/i18n';

export function CartPageLoading() {
  const pathname = usePathname() ?? '';
  const langSegment = pathname.split('/').filter(Boolean)[0] ?? 'ru';
  const lang: Locale = isValidLocale(langSegment) ? langSegment : 'ru';
  const label = translations[lang].cart.cartLoading;

  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </div>
  );
}
