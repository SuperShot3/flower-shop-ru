import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  PolicyInlineLink,
  PolicyPageLayout,
  PolicySection,
  PolicyText,
} from '@/components/legal/PolicyPageLayout';
import { isValidLocale, translations, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isValidLocale(params.lang)) return { title: 'Terms of Service' };
  const t = translations[params.lang as Locale].legal.terms;
  return { title: t.metaTitle };
}

export default function TermsPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = translations[locale].legal.terms;

  return (
    <PolicyPageLayout lang={locale} title={t.title} intro={t.intro} callout={t.sellerPlaceholder}>
      <PolicySection heading={t.orderHeading}>
        <PolicyText>{t.orderText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.pricesHeading}>
        <PolicyText>{t.pricesText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.refundsHeading}>
        <PolicyText>
          {t.refundsBeforeLink}{' '}
          <PolicyInlineLink href={`/${locale}/refund-replacement`}>{t.refundsLinkLabel}</PolicyInlineLink>{' '}
          {t.refundsAfterLink}
        </PolicyText>
      </PolicySection>

      <PolicySection heading={t.privacyHeading}>
        <PolicyText>
          {t.privacyBeforePrivacy}{' '}
          <PolicyInlineLink href={`/${locale}/privacy`}>{t.privacyLinkLabel}</PolicyInlineLink>{' '}
          {t.privacyMiddle}{' '}
          <PolicyInlineLink href={`/${locale}/cookies`}>{t.cookiesLinkLabel}</PolicyInlineLink>
          {t.privacyAfterLink}
        </PolicyText>
      </PolicySection>

      <PolicySection heading={t.changesHeading}>
        <PolicyText>{t.changesText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.contactHeading}>
        <PolicyText>
          {t.contactText}{' '}
          <PolicyInlineLink href={`/${locale}/contact`}>{t.contactLinkLabel}</PolicyInlineLink>
          {t.contactAfterLink}
        </PolicyText>
      </PolicySection>
    </PolicyPageLayout>
  );
}
