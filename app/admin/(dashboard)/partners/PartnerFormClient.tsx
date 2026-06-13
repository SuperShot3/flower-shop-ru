'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Chips } from '@/components/partner/Chips';
import { Toggle } from '@/components/partner/Toggle';
import type { CatalogPartnerRow } from '@/lib/catalog/types';
import { EKB_DISTRICTS } from '@/lib/market/ekbDistricts';
import {
  CATEGORY_OPTIONS,
  FLOWER_STOCK_OPTIONS,
  PREP_TIME_OPTIONS,
} from '@/lib/partnerPortal';
import {
  createPartnerCrmAction,
  setPartnerStatusAction,
  updatePartnerCrmAction,
} from './actions';

export type PartnerCrmFormValues = {
  shopName: string;
  contactName: string;
  phoneNumber: string;
  telegram: string;
  whatsapp: string;
  shopAddress: string;
  district: string;
  stockCategories: string[];
  flowersInStock: string[];
  internalNotes: string;
  selfDeliver: boolean;
  deliveryZones: string;
  prepTimeNote: string;
};

export function partnerToFormValues(partner?: CatalogPartnerRow | null): PartnerCrmFormValues {
  return {
    shopName: partner?.shop_name ?? '',
    contactName: partner?.contact_name ?? '',
    phoneNumber: partner?.phone_number ?? '',
    telegram: partner?.telegram ?? '',
    whatsapp: partner?.whatsapp ?? '',
    shopAddress: partner?.shop_address ?? '',
    district: partner?.district ?? '',
    stockCategories: partner?.stock_categories ?? [],
    flowersInStock: partner?.flowers_in_stock ?? [],
    internalNotes: partner?.internal_notes ?? '',
    selfDeliver: partner?.self_deliver ?? false,
    deliveryZones: partner?.delivery_zones ?? '',
    prepTimeNote: partner?.prep_time_note ?? '',
  };
}

type PartnerFormClientProps = {
  mode: 'create' | 'edit';
  partner?: CatalogPartnerRow;
};

export function PartnerFormClient({ mode, partner }: PartnerFormClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<PartnerCrmFormValues>(() => partnerToFormValues(partner));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const setField = <K extends keyof PartnerCrmFormValues>(key: K, value: PartnerCrmFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleChip = (key: 'stockCategories' | 'flowersInStock', value: string) => {
    setForm((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = new FormData();
    payload.set('shopName', form.shopName);
    payload.set('contactName', form.contactName);
    payload.set('phoneNumber', form.phoneNumber);
    payload.set('telegram', form.telegram);
    payload.set('whatsapp', form.whatsapp);
    payload.set('shopAddress', form.shopAddress);
    payload.set('district', form.district);
    payload.set('stockCategories', form.stockCategories.join(','));
    payload.set('flowersInStock', form.flowersInStock.join(','));
    payload.set('internalNotes', form.internalNotes);
    payload.set('selfDeliver', String(form.selfDeliver));
    payload.set('deliveryZones', form.deliveryZones);
    payload.set('prepTimeNote', form.prepTimeNote);

    const result =
      mode === 'create'
        ? await createPartnerCrmAction(payload)
        : await updatePartnerCrmAction(partner!.id, payload);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'create' && 'id' in result && result.id) {
      router.push(`/admin/partners/${result.id}`);
      router.refresh();
      return;
    }

    router.push('/admin/partners');
    router.refresh();
  };

  const handleStatusToggle = async () => {
    if (!partner) return;
    const nextStatus = partner.status === 'disabled' ? 'approved' : 'disabled';
    const label = nextStatus === 'disabled' ? 'отключить' : 'включить';
    if (!confirm(`Вы уверены, что хотите ${label} этого партнёра?`)) return;

    setStatusBusy(true);
    const result = await setPartnerStatusAction(partner.id, nextStatus);
    setStatusBusy(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  const categoryOptions = CATEGORY_OPTIONS.map((c) => ({
    value: c.value,
    label: c.labelRu,
    icon: c.icon,
  }));

  const flowerOptions = FLOWER_STOCK_OPTIONS.map((f) => ({
    value: f.value,
    label: f.labelRu,
  }));

  return (
    <div className="admin-partners-crm-form-page">
      <header className="admin-header admin-page-header">
        <div>
          <Link href="/admin/partners" className="admin-back-link">
            ← К списку
          </Link>
          <h1 className="admin-title">
            {mode === 'create' ? 'Новый партнёр' : partner?.shop_name ?? 'Партнёр'}
          </h1>
          <p className="admin-hint">
            {mode === 'create'
              ? 'Заполните после встречи — запись сразу попадёт в справочник'
              : 'Редактирование контактов, ассортимента и заметок'}
          </p>
        </div>
      </header>

      <form className="admin-partners-crm-form" onSubmit={handleSubmit}>
        {error ? <p className="admin-field-error admin-partners-crm-form-error">{error}</p> : null}

        <section className="admin-partners-crm-form-section">
          <h2>Основное</h2>
          <label className="admin-label">
            Название магазина *
            <input
              className="admin-input"
              value={form.shopName}
              onChange={(e) => setField('shopName', e.target.value)}
              required
            />
          </label>
          <label className="admin-label">
            Контактное лицо *
            <input
              className="admin-input"
              value={form.contactName}
              onChange={(e) => setField('contactName', e.target.value)}
              required
            />
          </label>
          <label className="admin-label">
            Район
            <select
              className="admin-input"
              value={form.district}
              onChange={(e) => setField('district', e.target.value)}
            >
              {EKB_DISTRICTS.map((d) => (
                <option key={d.value || 'empty'} value={d.value}>
                  {d.labelRu}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-label">
            Адрес
            <input
              className="admin-input"
              value={form.shopAddress}
              onChange={(e) => setField('shopAddress', e.target.value)}
            />
          </label>
        </section>

        <section className="admin-partners-crm-form-section">
          <h2>Связь</h2>
          <p className="admin-hint">Нужен хотя бы один способ связи</p>
          <label className="admin-label">
            Телефон
            <input
              className="admin-input"
              type="tel"
              inputMode="tel"
              value={form.phoneNumber}
              onChange={(e) => setField('phoneNumber', e.target.value)}
            />
          </label>
          <label className="admin-label">
            Telegram
            <input
              className="admin-input"
              placeholder="@username"
              value={form.telegram}
              onChange={(e) => setField('telegram', e.target.value)}
            />
          </label>
          <label className="admin-label">
            WhatsApp
            <input
              className="admin-input"
              type="tel"
              inputMode="tel"
              placeholder="+7 …"
              value={form.whatsapp}
              onChange={(e) => setField('whatsapp', e.target.value)}
            />
          </label>
        </section>

        <section className="admin-partners-crm-form-section">
          <h2>Ассортимент</h2>
          <p className="admin-hint">Категории товаров</p>
          <Chips
            options={categoryOptions}
            selected={form.stockCategories}
            onToggle={(value) => toggleChip('stockCategories', value)}
          />
          <p className="admin-hint">Цветы в наличии</p>
          <Chips
            options={flowerOptions}
            selected={form.flowersInStock}
            onToggle={(value) => toggleChip('flowersInStock', value)}
          />
        </section>

        <section className="admin-partners-crm-form-section">
          <h2>Доставка и сроки</h2>
          <Toggle
            label="Сам доставляет"
            value={form.selfDeliver}
            onChange={(checked) => setField('selfDeliver', checked)}
          />
          <label className="admin-label">
            Зоны доставки
            <textarea
              className="admin-input admin-textarea"
              rows={3}
              value={form.deliveryZones}
              onChange={(e) => setField('deliveryZones', e.target.value)}
              placeholder="Например: Ленинский, центр, до 5 км"
            />
          </label>
          <label className="admin-label">
            Срок сборки
            <select
              className="admin-input"
              value={form.prepTimeNote}
              onChange={(e) => setField('prepTimeNote', e.target.value)}
            >
              <option value="">Не указано</option>
              {PREP_TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.labelRu}>
                  {option.labelRu}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="admin-partners-crm-form-section">
          <h2>Заметки</h2>
          <label className="admin-label">
            Внутренние заметки
            <textarea
              className="admin-input admin-textarea"
              rows={5}
              value={form.internalNotes}
              onChange={(e) => setField('internalNotes', e.target.value)}
              placeholder="Страна роз, длина стебля, цены, что под заказ…"
            />
          </label>
        </section>

        <div className="admin-partners-crm-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <Link href="/admin/partners" className="admin-btn admin-btn-outline">
            Отмена
          </Link>
          {mode === 'edit' && partner ? (
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-partners-crm-status-btn"
              disabled={statusBusy}
              onClick={handleStatusToggle}
            >
              {partner.status === 'disabled' ? 'Включить' : 'Отключить'}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
