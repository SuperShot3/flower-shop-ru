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
  if (!isValidLocale(params.lang)) return { title: 'Cookie Policy' };
  const t = translations[params.lang as Locale].legal.cookies;
  return { title: t.metaTitle };
}

export default function CookiePolicyPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = translations[locale].legal.cookies;

  return (
    <PolicyPageLayout lang={locale} title={t.title} intro={t.intro}>
      <PolicySection heading={t.essentialHeading}>
        <PolicyText>{t.essentialText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.analyticsHeading}>
        <PolicyText>{t.analyticsText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.manageHeading}>
        <PolicyText>{t.manageText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.relatedHeading}>
        <PolicyText>
          {t.privacyBeforeLink}{' '}
          <PolicyInlineLink href={`/${locale}/privacy`}>{t.privacyLinkLabel}</PolicyInlineLink>
          {t.privacyAfterLink}
        </PolicyText>
      </PolicySection>
    </PolicyPageLayout>
  );
}
