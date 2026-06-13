'use client';

import {
  PolicyInlineLink,
  PolicyList,
  PolicyNote,
  PolicyPageLayout,
  PolicySection,
  PolicyText,
} from '@/components/legal/PolicyPageLayout';
import { translations } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export function RefundReplacementClient({ lang }: { lang: Locale }) {
  const t = translations[lang].refundPolicy;
  const contactHref = `/${lang}/contact`;

  return (
    <PolicyPageLayout lang={lang} title={t.title} intro={t.intro} lastUpdated={t.lastUpdated}>
      <PolicySection heading={t.timeLimitTitle}>
        <PolicyText>{t.timeLimitText}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.eligibleTitle}>
        <PolicyText>{t.eligibleIntro}</PolicyText>
        <PolicyList items={[t.eligibleList1, t.eligibleList2, t.eligibleList3]} />
        <PolicyText>{t.eligibleOutro}</PolicyText>
        <PolicyList items={[t.eligibleOption1, t.eligibleOption2]} />
        <PolicyNote>{t.keepBouquetNote}</PolicyNote>
      </PolicySection>

      <PolicySection heading={t.whatToSendTitle}>
        <PolicyText>
          {t.whatToSendIntro}{' '}
          <PolicyInlineLink href={contactHref}>{t.contactPageLabel}</PolicyInlineLink>{' '}
          {t.whatToSendIntroSuffix}
        </PolicyText>
        <PolicyList
          items={[t.whatToSendList1, t.whatToSendList2, t.whatToSendList3, t.whatToSendList4]}
        />
      </PolicySection>

      <PolicySection heading={t.notEligibleTitle}>
        <PolicyText>{t.notEligibleIntro}</PolicyText>
        <PolicyList
          items={[
            t.notEligible1,
            t.notEligible2,
            t.notEligible3,
            t.notEligible4,
            t.notEligible5,
            t.notEligible6,
          ]}
        />
      </PolicySection>

      <PolicySection heading={t.aiImagesTitle}>
        <PolicyText>{t.aiImagesIntro}</PolicyText>
        <PolicyText>{t.aiImagesBody}</PolicyText>
        <PolicyList
          items={[t.aiImagesList1, t.aiImagesList2, t.aiImagesList3, t.aiImagesList4]}
        />
        <PolicyText>{t.aiImagesOutro}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.substitutionsTitle}>
        <PolicyText>{t.substitutionsIntro}</PolicyText>
        <PolicyList items={[t.substitutions1, t.substitutions2, t.substitutions3]} />
      </PolicySection>

      <PolicySection heading={t.deliveryIssuesTitle}>
        <PolicyText>{t.deliveryIssues}</PolicyText>
      </PolicySection>

      <PolicySection heading={t.refundMethodTitle}>
        <PolicyList items={[t.refundMethod1, t.refundMethod2, t.refundMethod3, t.refundMethod4]} />
      </PolicySection>

      <PolicySection heading={t.howToContactTitle}>
        <PolicyText>
          {t.howToContactIntro}{' '}
          <PolicyInlineLink href={contactHref}>{t.contactPageLabel}</PolicyInlineLink>{' '}
          {t.howToContactOutro}
        </PolicyText>
      </PolicySection>
    </PolicyPageLayout>
  );
}
