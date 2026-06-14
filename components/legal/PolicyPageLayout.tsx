import Link from 'next/link';
import { translations, type Locale } from '@/lib/i18n';

function PolicyListIcon() {
  return (
    <svg
      className="policy-list-icon-svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="3" fill="currentColor" />
    </svg>
  );
}

export function PolicyPageLayout({
  lang,
  title,
  subtitle,
  intro,
  callout,
  lastUpdated,
  children,
}: {
  lang: Locale;
  title: string;
  subtitle?: string;
  intro?: string;
  callout?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  const homeLabel = translations[lang].nav.home;

  return (
    <div className="policy-page">
      <div className="container policy-page-inner">
        <header className="policy-page-hero">
          <h1 className="policy-title">{title}</h1>
          {subtitle ? <p className="policy-subtitle">{subtitle}</p> : null}
          {lastUpdated ? <p className="policy-last-updated">{lastUpdated}</p> : null}
          {intro ? <p className="policy-intro">{intro}</p> : null}
        </header>

        <article className="policy-document">
          {callout ? <aside className="policy-callout">{callout}</aside> : null}
          <div className="policy-body">{children}</div>
          <footer className="policy-back">
            <Link href={`/${lang}`} className="policy-link">
              ← {homeLabel}
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}

export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="policy-section">
      <h2 className="policy-heading">{heading}</h2>
      <div className="policy-section-content">{children}</div>
    </section>
  );
}

export function PolicyText({ children }: { children: React.ReactNode }) {
  return <p className="policy-text">{children}</p>;
}

export function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="policy-list">
      {items.map((item, index) => (
        <li key={index} className="policy-list-item">
          <span className="policy-list-icon">
            <PolicyListIcon />
          </span>
          <span className="policy-list-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PolicyNote({ children }: { children: React.ReactNode }) {
  return <aside className="policy-note">{children}</aside>;
}

export function PolicyInlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="policy-link-inline">
      {children}
    </Link>
  );
}
