import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  PolicyInlineLink,
  PolicyList,
  PolicyPageLayout,
  PolicySection,
  PolicyText,
} from '@/components/legal/PolicyPageLayout';
import { isValidLocale, translations, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isValidLocale(params.lang)) return { title: 'Privacy Policy' };
  const t = translations[params.lang as Locale].legal.privacy;
  return { title: t.metaTitle };
}

export default function PrivacyPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = translations[locale].legal.privacy;
  const requisitesNote = translations[locale].legal.terms.sellerPlaceholder;

  return (
    <PolicyPageLayout
      lang={locale}
      title={t.title}
      intro={t.intro}
      callout={requisitesNote}
    >
      <PolicySection heading={t.operatorHeading}>
        <PolicyText>{t.operatorText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.collectedHeading}>
        <PolicyList
          items={[
            t.collectedList1,
            t.collectedList2,
            t.collectedList3,
            t.collectedList4,
            t.collectedList5,
          ]}
        />
      </PolicySection>

      <PolicySection heading={t.purposesHeading}>
        <PolicyList items={[t.purposesList1, t.purposesList2, t.purposesList3]} />
      </PolicySection>

      <PolicySection heading={t.legalBasisHeading}>
        <PolicyText>{t.legalBasisText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.processorsHeading}>
        <PolicyText>{t.processorsText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.analyticsHeading}>
        <PolicyText>{t.analyticsText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.retentionHeading}>
        <PolicyText>{t.retentionText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.rightsHeading}>
        <PolicyList items={[t.rightsList1, t.rightsList2, t.rightsList3, t.rightsList4]} />
        <PolicyText>{t.rightsText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.cookiesHeading}>
        <PolicyText>
          {t.cookiesBeforeLink}{' '}
          <PolicyInlineLink href={`/${locale}/cookies`}>{t.cookiesLinkLabel}</PolicyInlineLink>
          {t.cookiesAfterLink}
        </PolicyText>
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
