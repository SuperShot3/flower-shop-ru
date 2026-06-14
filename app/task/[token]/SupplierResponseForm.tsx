'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  SupplierMessageCardSnapshot,
  SupplierPreparationSnapshot,
  SupplierProductSnapshot,
  SupplierResponseType,
} from '@/lib/supplierRequests';

interface SupplierResponseFormProps {
  token: string;
  product: SupplierProductSnapshot;
  preparation: SupplierPreparationSnapshot;
  messageCard: SupplierMessageCardSnapshot;
}

type Lang = 'ru' | 'en';

type CompletionSummary = {
  responseType: SupplierResponseType;
  priceValue: number;
  readyTime: string;
  reason: string;
  notes: string;
  lang: Lang;
};

const RESPONSE_ORDER: SupplierResponseType[] = ['PREPARE', 'PREPARE_WITH_CHANGES', 'DECLINE'];

const RESPONSE_COPY: Record<
  SupplierResponseType,
  Record<Lang, { title: string; helper: string }>
> = {
  PREPARE: {
    ru: {
      title: 'Принять как указано',
      helper: 'Цена и время соответствуют запросу',
    },
    en: {
      title: 'Accept as specified',
      helper: 'Price and timing match what was shared',
    },
  },
  PREPARE_WITH_CHANGES: {
    ru: {
      title: 'Могу выполнить с изменениями',
      helper: 'например, цвет, цветы, время или цена',
    },
    en: {
      title: 'Can fulfill with changes',
      helper: 'e.g. color, flowers, time, or price',
    },
  },
  DECLINE: {
    ru: {
      title: 'Не могу принять заказ',
      helper: 'Кратко укажите причину для координатора',
    },
    en: {
      title: 'Cannot take this job',
      helper: 'Brief reason helps the coordinator',
    },
  },
};

function supplierTaskCompletionKey(publicToken: string) {
  return `supplier-task-reply-done:${publicToken}`;
}

function formatPriceDisplay(value: number, lang: Lang): string {
  return new Intl.NumberFormat((lang === 'ru' ? 'ru-RU' : 'en-US'), {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function truncateDisplay(text: string, maxLen: number): string {
  const s = text.trim();
  if (!s) return '';
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
}

function SupplierLoaderFlower() {
  const petals = [0, 72, 144, 216, 288];
  return (
    <div className="supplier-task-loader-visual" aria-hidden>
      <div className="supplier-task-loader-ring" />
      <svg className="supplier-task-loader-flower" viewBox="0 0 64 64" width="80" height="80">
        <circle cx="32" cy="32" r="7" fill="#b16748" />
        {petals.map((deg) => (
          <ellipse
            key={deg}
            cx="32"
            cy="14"
            rx="9"
            ry="14"
            fill="#e8a090"
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
      </svg>
    </div>
  );
}

const UI: Record<
  Lang,
  {
    openPhoto: string;
    productPhotoAlt: string;
    noPhoto: string;
    kicker: string;
    heroTitle: string;
    heroHint: string;
    sectionProduct: string;
    size: string;
    prepTime: (minutes: number) => string;
    unspecified: string;
    customGiftNote: (text: string) => string;
    customCommentsNote: (text: string) => string;
    sectionTimePlace: string;
    date: string;
    window: string;
    sectionMessage: string;
    card: string;
    balloon: string;
    wrap: string;
    customCard: string;
    noExtraMessage: string;
    replyHeading: string;
    priceLabel: string;
    pricePlaceholder: string;
    readyLabel: string;
    readyPlaceholder: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    storePhotosLabel: string;
    storePhotosSoon: string;
    submit: string;
    submitting: string;
    modalClose: string;
    submitError: string;
    submitErrorNetwork: string;
    validationPriceReady: string;
    invalidPrice: string;
    thankYouHeadline: string;
    summaryHeading: string;
    summaryReply: string;
    summaryPrice: string;
    summaryReady: string;
    summaryReason: string;
    summaryNotes: string;
    closeWindow: string;
    closeTabHint: string;
    sendingOverlay: string;
    langGroup: string;
    russian: string;
    english: string;
  }
> = {
  ru: {
    openPhoto: 'Открыть фото товара',
    productPhotoAlt: 'Фото товара',
    noPhoto: 'Нет фото товара',
    kicker: 'Запрос на подготовку',
    heroTitle: 'Детали заказа',
    heroHint: 'Проверьте товар, время и текст открытки перед ответом.',
    sectionProduct: 'Товары',
    size: 'Размер',
    prepTime: (m) => `Время подготовки ${m} мин`,
    unspecified: 'Не указано',
    customGiftNote: (text) => `Детали индивидуального заказа: ${text}`,
    customCommentsNote: (text) => `Дополнительные комментарии: ${text}`,
    sectionTimePlace: 'Время и район',
    date: 'Дата',
    window: 'Временной интервал',
    sectionMessage: 'Сообщения и дополнения',
    card: 'Открытка',
    balloon: 'Шар',
    wrap: 'Упаковка',
    customCard: 'Индивидуальная открытка',
    noExtraMessage: 'Без дополнительного текста',
    replyHeading: 'Ответить на запрос',
    priceLabel: 'Предложенная цена',
    pricePlaceholder: 'например, 500 ₽',
    readyLabel: 'Время готовности',
    readyPlaceholder: 'например, сегодня 16:00',
    reasonLabel: 'Причина или условия',
    reasonPlaceholder: 'Что нужно изменить или почему не можете принять заказ',
    notesLabel: 'Дополнительные заметки',
    notesPlaceholder: 'Подробности для координатора',
    storePhotosLabel: 'Фото из магазина',
    storePhotosSoon: 'Загрузка фото скоро будет доступна',
    submit: 'Отправить ответ',
    submitting: 'Отправка…',
    modalClose: 'Закрыть',
    submitError: 'Не удалось отправить ответ. Попробуйте ещё раз.',
    submitErrorNetwork: 'Не удалось отправить ответ. Проверьте интернет и попробуйте снова.',
    validationPriceReady: 'Укажите цену и время готовности.',
    invalidPrice: 'Укажите корректную цену.',
    thankYouHeadline: 'Ответ отправлен. Спасибо.',
    summaryHeading: 'Отправленные данные',
    summaryReply: 'Ваш ответ',
    summaryPrice: 'Предложенная цена',
    summaryReady: 'Время готовности',
    summaryReason: 'Причина или условия',
    summaryNotes: 'Дополнительные заметки',
    closeWindow: 'Закрыть окно',
    closeTabHint: 'Если окно не закрылось, закройте вкладку вручную.',
    sendingOverlay: 'Отправка ответа…',
    langGroup: 'Язык',
    russian: 'Русский',
    english: 'English',
  },
  en: {
    openPhoto: 'Open product photo',
    productPhotoAlt: 'Product photo',
    noPhoto: 'No product photo',
    kicker: 'Product preparation request',
    heroTitle: 'Job details',
    heroHint: 'Please review product, timing, and card details before you reply.',
    sectionProduct: 'Products',
    size: 'Size',
    prepTime: (m) => `Prep time ${m} min`,
    unspecified: 'Not specified',
    customGiftNote: (text) => `Custom gift details: ${text}`,
    customCommentsNote: (text) => `Additional notes: ${text}`,
    sectionTimePlace: 'Time and area',
    date: 'Date',
    window: 'Time window',
    sectionMessage: 'Messages and extras',
    card: 'Card',
    balloon: 'Balloon',
    wrap: 'Wrapping',
    customCard: 'Custom greeting card',
    noExtraMessage: 'No extra message',
    replyHeading: 'Reply to this request',
    priceLabel: 'Quoted price',
    pricePlaceholder: 'e.g. 500 ₽',
    readyLabel: 'Ready time',
    readyPlaceholder: 'e.g. Today 4:00 PM',
    reasonLabel: 'Reason or conditions',
    reasonPlaceholder: 'What needs to change, or why you cannot take the job',
    notesLabel: 'Extra notes',
    notesPlaceholder: 'More detail for the coordinator',
    storePhotosLabel: 'Photos from shop',
    storePhotosSoon: 'Photo upload coming soon',
    submit: 'Send reply',
    submitting: 'Sending…',
    modalClose: 'Close',
    submitError: 'Could not send your reply. Please try again.',
    submitErrorNetwork: 'Could not send your reply. Check your connection and try again.',
    validationPriceReady: 'Please enter your quoted price and ready time.',
    invalidPrice: 'Please enter a valid price.',
    thankYouHeadline: 'Reply sent. Thank you.',
    summaryHeading: 'What you submitted',
    summaryReply: 'Your reply',
    summaryPrice: 'Quoted price',
    summaryReady: 'Ready time',
    summaryReason: 'Reason or conditions',
    summaryNotes: 'Extra notes',
    closeWindow: 'Close window',
    closeTabHint: 'If the window did not close, you can close this tab manually.',
    sendingOverlay: 'Sending your reply…',
    langGroup: 'Language',
    russian: 'Русский',
    english: 'English',
  },
};

export function SupplierResponseForm({
  token,
  product,
  preparation,
  messageCard,
}: SupplierResponseFormProps) {
  const [lang, setLang] = useState<Lang>('ru');
  const t = UI[lang];

  const firstImage = product.items.find((item) => item.imageUrl)?.imageUrl ?? null;
  const [photoOpen, setPhotoOpen] = useState(false);
  const [responseType, setResponseType] = useState<SupplierResponseType>('PREPARE');
  const [price, setPrice] = useState('');
  const [readyTime, setReadyTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<CompletionSummary | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(supplierTaskCompletionKey(token));
      if (!raw) return;
      const parsed = JSON.parse(raw) as CompletionSummary;
      if (!parsed?.responseType || typeof parsed.priceValue !== 'number') return;
      setCompleted(parsed);
      setLang(parsed.lang);
    } catch {
      /* ignore corrupt storage */
    }
  }, [token]);

  useEffect(() => {
    if (!submitting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [submitting]);

  async function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || completed) return;
    setFormError(null);

    const priceTrim = price.trim();
    const readyTrim = readyTime.trim();
    if (!priceTrim || !readyTrim) {
      setFormError(t.validationPriceReady);
      return;
    }
    const parsed = Number(priceTrim.replace(/,/g, ''));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFormError(t.invalidPrice);
      return;
    }

    setPhotoOpen(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/supplier-requests/${encodeURIComponent(token)}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: responseType,
          supplier_price: price,
          supplier_ready_time: readyTime,
          supplier_reason: reason,
          supplier_notes: notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(typeof data.error === 'string' ? data.error : UI[lang].submitError);
        return;
      }
      const summary: CompletionSummary = {
        responseType,
        priceValue: parsed,
        readyTime: readyTrim,
        reason: reason.trim(),
        notes: notes.trim(),
        lang,
      };
      try {
        sessionStorage.setItem(supplierTaskCompletionKey(token), JSON.stringify(summary));
      } catch {
        /* quota / private mode */
      }
      setCompleted(summary);
    } catch {
      setFormError(UI[lang].submitErrorNetwork);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseThankYou() {
    window.close();
  }

  if (completed) {
    const tc = UI[lang];
    const replyTitle = RESPONSE_COPY[completed.responseType][lang].title;
    const reasonShown = truncateDisplay(completed.reason, 280);
    const notesShown = truncateDisplay(completed.notes, 280);

    return (
      <div className="supplier-task-shell">
        <div className="supplier-task-toolbar supplier-task-thankyou-toolbar">
          <div className="supplier-task-lang" role="group" aria-label={tc.langGroup}>
            <button
              type="button"
              className={`supplier-task-lang-btn ${''}`}
              onClick={() => setLang('ru')}
              aria-pressed={lang === 'ru'}
            >
              {tc.russian}
            </button>
            <button
              type="button"
              className={`supplier-task-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              {tc.english}
            </button>
          </div>
        </div>

        <main className="supplier-task-thankyou-card">
          <h1>{tc.thankYouHeadline}</h1>
          <p className="supplier-task-thankyou-lead">{tc.summaryHeading}</p>
          <ul className="supplier-task-summary-list">
            <li>
              <div className="supplier-task-summary-k">{tc.sectionProduct}</div>
              <div className="supplier-task-summary-v">
                {truncateDisplay(
                  product.items.map((item) => item.displayTitle).join(' · '),
                  120
                )}
              </div>
            </li>
            <li>
              <div className="supplier-task-summary-k">{tc.summaryReply}</div>
              <div className="supplier-task-summary-v">{replyTitle}</div>
            </li>
            <li>
              <div className="supplier-task-summary-k">{tc.summaryPrice}</div>
              <div className="supplier-task-summary-v">{formatPriceDisplay(completed.priceValue, lang)}</div>
            </li>
            <li>
              <div className="supplier-task-summary-k">{tc.summaryReady}</div>
              <div className="supplier-task-summary-v">{completed.readyTime}</div>
            </li>
            {reasonShown ? (
              <li>
                <div className="supplier-task-summary-k">{tc.summaryReason}</div>
                <div className="supplier-task-summary-v">{reasonShown}</div>
              </li>
            ) : null}
            {notesShown ? (
              <li>
                <div className="supplier-task-summary-k">{tc.summaryNotes}</div>
                <div className="supplier-task-summary-v">{notesShown}</div>
              </li>
            ) : null}
          </ul>
          <div className="supplier-task-thankyou-actions">
            <button type="button" onClick={handleCloseThankYou}>
              {tc.closeWindow}
            </button>
            <p className="supplier-task-thankyou-hint">{tc.closeTabHint}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="supplier-task-shell" aria-busy={submitting}>
      <main className="supplier-task-card" aria-hidden={submitting}>
        <div className="supplier-task-toolbar">
          <div className="supplier-task-lang" role="group" aria-label={t.langGroup}>
            <button
              type="button"
              className={`supplier-task-lang-btn ${''}`}
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

        <section className="supplier-task-hero">
          {firstImage ? (
            <button
              type="button"
              className="supplier-task-photo-button"
              onClick={() => setPhotoOpen(true)}
              aria-label={t.openPhoto}
            >
              <img
                src={firstImage}
                alt={product.items[0]?.displayTitle ?? t.productPhotoAlt}
              />
            </button>
          ) : (
            <div className="supplier-task-photo-empty">{t.noPhoto}</div>
          )}
          <div>
            <p className="supplier-task-kicker">{t.kicker}</p>
            <h1>{t.heroTitle}</h1>
            <p className="supplier-task-muted">{t.heroHint}</p>
          </div>
        </section>

        <section className="supplier-task-section">
          <h2>{t.sectionProduct}</h2>
          <div className="supplier-task-items">
            {product.items.map((item, index) => (
              <article key={`${item.displayTitle}:${index}`} className="supplier-task-item">
                <div>
                  <strong>{item.displayTitle}</strong>
                  <p>
                    {t.size}: {item.sizeTh ?? item.size ?? t.unspecified}
                    {item.preparationTimeMinutes
                      ? ` · ${t.prepTime(item.preparationTimeMinutes)}`
                      : ''}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {product.customOrder?.giftDescription && (
            <p className="supplier-task-note">{t.customGiftNote(product.customOrder.giftDescription)}</p>
          )}
          {product.customOrder?.customerComments && (
            <p className="supplier-task-note">{t.customCommentsNote(product.customOrder.customerComments)}</p>
          )}
        </section>

        <section className="supplier-task-section supplier-task-grid">
          <div className="supplier-task-grid-col" aria-label={t.sectionTimePlace}>
            <p className="supplier-task-schedule-line">
              {t.date}: {preparation.deliveryDate ?? t.unspecified}
            </p>
            <p className="supplier-task-schedule-line">
              {t.window}: {preparation.deliveryWindow ?? t.unspecified}
            </p>
          </div>
          <div className="supplier-task-grid-col" aria-label={t.sectionMessage}>
            {messageCard.cards.some((card) => card.cardMessage || card.balloonText) ||
            messageCard.customGreetingCard ? (
              <>
                {messageCard.cards.map((card, index) => (
                  <div key={`${card.itemTitle}:${index}`} className="supplier-task-note supplier-task-message-item">
                    {card.cardMessage && (
                      <p className="supplier-task-message-line">
                        {t.card}: {card.cardMessage}
                      </p>
                    )}
                    {card.balloonText && (
                      <p className="supplier-task-message-line">
                        {t.balloon}: {card.balloonText}
                      </p>
                    )}
                    {card.wrappingOption && (
                      <p className="supplier-task-message-line">
                        {t.wrap}: {card.wrappingOption}
                      </p>
                    )}
                  </div>
                ))}
                {messageCard.customGreetingCard && (
                  <p className="supplier-task-message-line">
                    {t.customCard}: {messageCard.customGreetingCard}
                  </p>
                )}
              </>
            ) : (
              <p>{t.noExtraMessage}</p>
            )}
          </div>
        </section>

        <form className="supplier-task-form" onSubmit={submitResponse}>
          <h2>{t.replyHeading}</h2>
          <div className="supplier-task-options">
            {RESPONSE_ORDER.map((value) => {
              const opt = RESPONSE_COPY[value][lang];
              return (
                <label
                  key={value}
                  className={`supplier-task-option ${responseType === value ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="response_type"
                    value={value}
                    checked={responseType === value}
                    onChange={() => setResponseType(value)}
                  />
                  <span>
                    <strong>{opt.title}</strong>
                    <small>{opt.helper}</small>
                  </span>
                </label>
              );
            })}
          </div>

          <label className="supplier-task-label">
            {t.priceLabel}
            <input
              name="supplier_price"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder={t.pricePlaceholder}
              required
              aria-required
            />
          </label>
          <label className="supplier-task-label">
            {t.readyLabel}
            <input
              name="supplier_ready_time"
              value={readyTime}
              onChange={(event) => setReadyTime(event.target.value)}
              autoComplete="off"
              placeholder={t.readyPlaceholder}
              required
              aria-required
            />
          </label>
          <label className="supplier-task-label">
            {t.reasonLabel}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder={t.reasonPlaceholder}
            />
          </label>
          <label className="supplier-task-label">
            {t.notesLabel}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder={t.notesPlaceholder}
            />
          </label>
          <label className="supplier-task-label supplier-task-upload-disabled">
            {t.storePhotosLabel}
            <button type="button" disabled>
              {t.storePhotosSoon}
            </button>
          </label>

          {formError && <p className="supplier-task-error">{formError}</p>}

          <div className="supplier-task-sticky">
            <button type="submit" disabled={submitting}>
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      </main>

      {submitting ? (
        <div
          className="supplier-task-submit-overlay"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={t.sendingOverlay}
        >
          <div className="supplier-task-loader-panel">
            <SupplierLoaderFlower />
            <p className="supplier-task-loader-text">{t.sendingOverlay}</p>
          </div>
        </div>
      ) : null}

      {photoOpen && firstImage && (
        <div className="supplier-task-modal" role="dialog" aria-modal="true">
          <button type="button" className="supplier-task-modal-close" onClick={() => setPhotoOpen(false)}>
            {t.modalClose}
          </button>
          <img src={firstImage} alt={product.items[0]?.displayTitle ?? t.productPhotoAlt} />
        </div>
      )}
    </div>
  );
}
