'use client';

import { getWhatsAppContactUrl } from '@/lib/messenger';
import { translations } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { getYandexMapsEmbedSrc } from '@/lib/yandexMapsUrl';
import { WhatsAppIcon } from '@/components/icons';

export function ContactPageClient({ lang }: { lang: Locale }) {
  const t = translations[lang].contact;
  const tLocation = translations[lang].location;

  return (
    <div className="contact-page">
      <div className="container">
        <h1 className="contact-title">{t.title}</h1>
        <p className="contact-intro">{t.intro}</p>

        <section className="contact-section">
          <h2 className="contact-heading">{t.fastestWay}</h2>
          <p className="contact-label">{t.messageUs}</p>
          <div className="contact-channels">
            <a
              href={getWhatsAppContactUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-channel-link"
              style={{ color: '#25D366' }}
            >
              <WhatsAppIcon size={22} />
              <span>{t.whatsapp}</span>
            </a>
          </div>
        </section>

        <section className="contact-section">
          <h2 className="contact-heading">{t.phoneLabel}</h2>
          <p className="contact-text">
            {t.callWhatsApp}{' '}
            <a
              href={getWhatsAppContactUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-phone-link"
            >
              {t.phoneDisplay}
            </a>
          </p>
        </section>

        <section className="contact-section">
          <h2 className="contact-heading">{t.emailLabel}</h2>
          <p className="contact-text">
            <a href={`mailto:${t.emailDisplay}`} className="contact-phone-link">
              {t.emailDisplay}
            </a>
          </p>
          <p className="contact-text contact-text-muted">{t.emailHint}</p>
        </section>

        <section className="contact-section">
          <h2 className="contact-heading">{t.serviceAreaHeading}</h2>
          <p className="contact-address">{t.address}</p>
        </section>

        <section className="contact-section">
          <h2 className="contact-heading">{t.businessHours}</h2>
          <p className="contact-text">
            <strong>{t.supportHoursLabel}</strong> {t.supportHoursValue}
          </p>
          <p className="contact-text">
            <strong>{t.deliveryHoursLabel}</strong> {t.deliveryHoursValue}
          </p>
        </section>

        <section className="contact-section">
          <p className="contact-text">{t.deliveryArea}</p>
        </section>

        <section className="contact-section">
          <p className="contact-text">{t.orderHelp}</p>
        </section>

        <section id="location" className="contact-section contact-section-location">
          <h2 className="contact-heading">{tLocation.title}</h2>
          <p className="contact-text">{tLocation.intro}</p>
          <p className="contact-address">{tLocation.address}</p>
          <div className="contact-map-wrap">
            <iframe
              src={getYandexMapsEmbedSrc(lang)}
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={tLocation.mapTitle}
              className="contact-map"
            />
          </div>
        </section>
      </div>
      <style jsx>{`
        .contact-page {
          padding: 32px 0 48px;
        }
        .contact-title {
          font-family: var(--font-serif);
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 12px;
        }
        .contact-intro {
          font-size: 1rem;
          color: var(--text);
          margin: 0 0 28px;
          line-height: 1.6;
        }
        .contact-section {
          margin-bottom: 28px;
        }
        .contact-section-location {
          margin-top: 40px;
          padding-top: 28px;
          border-top: 1px solid var(--border);
        }
        .contact-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 10px;
        }
        .contact-label,
        .contact-text {
          font-size: 1rem;
          color: var(--text);
          margin: 0 0 12px;
          line-height: 1.6;
        }
        .contact-text-muted {
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .contact-address {
          font-size: 1rem;
          color: var(--text-muted);
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .contact-channels {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
        }
        .contact-channel-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--pastel-cream);
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .contact-channel-link:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .contact-phone-link {
          font-weight: 600;
          color: var(--accent);
          text-decoration: underline;
        }
        .contact-phone-link:hover {
          color: #967a4d;
        }
        .contact-map-wrap {
          margin-top: 16px;
          width: 100%;
          max-width: 600px;
          aspect-ratio: 600 / 450;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .contact-map {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>
    </div>
  );
}
