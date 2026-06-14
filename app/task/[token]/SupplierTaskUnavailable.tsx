'use client';

import { useState } from 'react';

type Lang = 'ru' | 'en';

const COPY: Record<Lang, { title: string; body: string; langGroup: string; russian: string; english: string }> = {
  ru: {
    title: 'Эта ссылка больше недоступна',
    body: 'Свяжитесь с координатором, чтобы получить актуальные детали.',
    langGroup: 'Язык',
    russian: 'Русский',
    english: 'English',
  },
  en: {
    title: 'This request is no longer available',
    body: 'Please contact the coordinator for the latest details.',
    langGroup: 'Language',
    russian: 'Russian',
    english: 'English',
  },
};

export function SupplierTaskUnavailable() {
  const [lang, setLang] = useState<Lang>('ru');
  const t = COPY[lang];

  return (
    <div className="supplier-task-shell">
      <main className="supplier-task-card supplier-task-unavailable">
        <div className="supplier-task-toolbar">
          <div className="supplier-task-lang" role="group" aria-label={t.langGroup}>
            <button
              type="button"
              className={`supplier-task-lang-btn ${lang === 'ru' ? 'is-active' : ''}`}
              onClick={() => setLang('ru')}
              aria-pressed={lang === 'ru'}
            >
              {t.russian}
            </button>
            <button
              type="button"
              className={`supplier-task-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              {t.english}
            </button>
          </div>
        </div>
        <h1>{t.title}</h1>
        <p>{t.body}</p>
      </main>
    </div>
  );
}
