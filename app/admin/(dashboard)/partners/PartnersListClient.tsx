'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { CatalogPartnerRow } from '@/lib/catalog/types';
import { EKB_DISTRICT_FILTER_OPTIONS, ekbDistrictLabel } from '@/lib/market/ekbDistricts';
import {
  categoryLabelRu,
  flowerStockLabelRu,
} from '@/lib/partnerPortal';
import {
  phoneTelHref,
  telegramHref,
  whatsappHref,
} from '@/lib/partnerContactLinks';

type PartnersListClientProps = {
  allPartners: CatalogPartnerRow[];
  initialDistrict: string;
  initialSearch: string;
};

function formatDateRu(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function categoryPreview(categories: string[] | null | undefined): string {
  const items = (categories ?? []).slice(0, 2).map(categoryLabelRu);
  if (!items.length) return '—';
  const extra = (categories?.length ?? 0) - items.length;
  return extra > 0 ? `${items.join(', ')} +${extra}` : items.join(', ');
}

export function PartnersListClient({
  allPartners,
  initialDistrict,
  initialSearch,
}: PartnersListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = searchParams ?? new URLSearchParams();
  const [searchDraft, setSearchDraft] = useState(initialSearch);

  const activeDistrict = initialDistrict;
  const activeSearch = initialSearch.trim().toLowerCase();

  const visiblePartners = useMemo(() => {
    return allPartners.filter((partner) => {
      if (activeDistrict && partner.district !== activeDistrict) return false;
      if (!activeSearch) return true;
      const haystack = [
        partner.shop_name,
        partner.shop_address,
        partner.contact_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(activeSearch);
    });
  }, [allPartners, activeDistrict, activeSearch]);

  const pushFilters = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    const qs = next.toString();
    router.push(qs ? `/admin/partners?${qs}` : '/admin/partners');
  };

  const districtCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const partner of allPartners) {
      if (!partner.district) continue;
      counts.set(partner.district, (counts.get(partner.district) ?? 0) + 1);
    }
    return counts;
  }, [allPartners]);

  return (
    <div className="admin-partners-crm">
      <header className="admin-partners-crm-header">
        <div>
          <h1 className="admin-title">Партнёры</h1>
          <p className="admin-hint">Справочник магазинов Екатеринбурга — фильтр по району и контакты</p>
        </div>
        <Link href="/admin/partners/new" className="admin-btn admin-btn-primary admin-partners-crm-add">
          + Партнёр
        </Link>
      </header>

      <div className="admin-partners-crm-filters">
        <form
          className="admin-partners-crm-search"
          onSubmit={(e) => {
            e.preventDefault();
            pushFilters({ q: searchDraft.trim() || undefined });
          }}
        >
          <input
            type="search"
            className="admin-input"
            placeholder="Поиск по названию, адресу, контакту…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          <button type="submit" className="admin-btn admin-btn-outline">
            Найти
          </button>
        </form>
      </div>

      <div className="admin-partners-crm-districts" role="tablist" aria-label="Районы">
        <button
          type="button"
          className={`admin-partner-tab ${!activeDistrict ? 'active' : ''}`}
          onClick={() => pushFilters({ district: undefined })}
        >
          Все ({allPartners.length})
        </button>
        {EKB_DISTRICT_FILTER_OPTIONS.map((district) => {
          const count = districtCounts.get(district.value) ?? 0;
          if (!count && activeDistrict !== district.value) return null;
          return (
            <button
              key={district.value}
              type="button"
              className={`admin-partner-tab ${activeDistrict === district.value ? 'active' : ''}`}
              onClick={() => pushFilters({ district: district.value })}
            >
              {district.labelRu}
              {count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {visiblePartners.length === 0 ? (
        <p className="admin-partner-empty">
          {allPartners.length === 0
            ? 'Партнёров пока нет. Добавьте первого после встречи с магазином.'
            : 'По выбранным фильтрам ничего не найдено.'}
        </p>
      ) : (
        <>
          <div className="admin-partners-crm-cards">
            {visiblePartners.map((partner) => {
              const tel = phoneTelHref(partner.phone_number);
              const tg = telegramHref(partner.telegram);
              const wa = whatsappHref(partner.whatsapp);
              return (
                <article
                  key={partner.id}
                  className={`admin-partners-crm-card ${partner.status === 'disabled' ? 'is-disabled' : ''}`}
                >
                  <Link href={`/admin/partners/${partner.id}`} className="admin-partners-crm-card-main">
                    <div className="admin-partners-crm-card-top">
                      <h2>{partner.shop_name}</h2>
                      {partner.status === 'disabled' ? (
                        <span className="admin-partner-badge admin-partner-badge--rejected">отключён</span>
                      ) : null}
                    </div>
                    <p className="admin-partners-crm-card-district">
                      {ekbDistrictLabel(partner.district)}
                    </p>
                    <p className="admin-partners-crm-card-meta">{partner.contact_name}</p>
                    <p className="admin-partners-crm-card-categories">
                      {categoryPreview(partner.stock_categories)}
                    </p>
                    {(partner.flowers_in_stock?.length ?? 0) > 0 ? (
                      <p className="admin-partners-crm-card-flowers">
                        {partner.flowers_in_stock.slice(0, 3).map(flowerStockLabelRu).join(', ')}
                      </p>
                    ) : null}
                    <p className="admin-partners-crm-card-date">
                      обновлён {formatDateRu(partner.updated_at)}
                    </p>
                  </Link>
                  <div className="admin-partners-crm-card-contacts">
                    {tel ? (
                      <a href={tel} className="admin-partners-crm-contact-btn">
                        Телефон
                      </a>
                    ) : null}
                    {tg ? (
                      <a
                        href={tg}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-partners-crm-contact-btn"
                      >
                        Telegram
                      </a>
                    ) : null}
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-partners-crm-contact-btn"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="admin-partners-crm-table-wrap">
            <table className="admin-partner-table admin-partners-crm-table">
              <thead>
                <tr>
                  <th>Магазин</th>
                  <th>Район</th>
                  <th>Контакт</th>
                  <th>Телефон</th>
                  <th>Категории</th>
                  <th>Статус</th>
                  <th>Обновлён</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visiblePartners.map((partner) => (
                  <tr key={partner.id} className={partner.status === 'disabled' ? 'is-disabled' : ''}>
                    <td>{partner.shop_name}</td>
                    <td>{ekbDistrictLabel(partner.district)}</td>
                    <td>{partner.contact_name}</td>
                    <td>{partner.phone_number || '—'}</td>
                    <td>{categoryPreview(partner.stock_categories)}</td>
                    <td>
                      <span
                        className={`admin-partner-badge admin-partner-badge--${
                          partner.status === 'disabled' ? 'rejected' : 'approved'
                        }`}
                      >
                        {partner.status === 'disabled' ? 'отключён' : 'активен'}
                      </span>
                    </td>
                    <td>{formatDateRu(partner.updated_at)}</td>
                    <td>
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
