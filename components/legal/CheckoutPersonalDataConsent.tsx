'use client';

import Link from 'next/link';
import { translations, type Locale } from '@/lib/i18n';

export type CheckoutPersonalDataConsentProps = {
  lang: Locale;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
};

export function CheckoutPersonalDataConsent({
  lang,
  checked,
  onChange,
  id = 'checkout-pd-consent',
  className = '',
}: CheckoutPersonalDataConsentProps) {
  const t = translations[lang].cart;

  return (
    <label
      className={`checkout-pd-consent ${className}`.trim()}
      htmlFor={id}
      data-checkout-pd-consent
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkout-pd-consent-input"
      />
      <span>
        {t.personalDataConsentLabelBefore}{' '}
        <Link href={`/${lang}/privacy`} className="checkout-pd-consent-link">
          {t.personalDataPrivacyLink}
        </Link>{' '}
        {t.personalDataConsentLabelAfter}
      </span>
      <style jsx>{`
        .checkout-pd-consent {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 11px;
          line-height: 1.35;
          font-weight: 400;
          color: var(--text-muted);
          cursor: pointer;
        }
        .checkout-pd-consent-input {
          margin: 2px 0 0;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          accent-color: var(--accent);
        }
        .checkout-pd-consent :global(.checkout-pd-consent-link) {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
        .checkout-pd-consent :global(.checkout-pd-consent-link:hover) {
          text-decoration: underline;
        }
      `}</style>
    </label>
  );
}
