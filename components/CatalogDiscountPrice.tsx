'use client';

import {
  applyCatalogDiscount,
  effectiveCatalogUnitPriceWithExpansion,
  hasCatalogDiscount,
} from '@/lib/catalogDiscount';
import type { DeliveryDestinationId } from '@/lib/delivery/markets';

export function CatalogDiscountPrice({
  basePrice,
  discountPercent,
  destinationId,
  fromLabel,
  className = '',
  amountClassName = '',
}: {
  basePrice: number;
  discountPercent?: number;
  destinationId: DeliveryDestinationId;
  fromLabel?: string;
  className?: string;
  amountClassName?: string;
}) {
  const discountedBase = applyCatalogDiscount(basePrice, discountPercent);
  const displayCurrent = effectiveCatalogUnitPriceWithExpansion(
    basePrice,
    discountPercent,
    destinationId
  );
  const onSale = hasCatalogDiscount(discountPercent) && discountedBase < basePrice;

  if (!onSale) {
    return (
      <span className={className}>
        {fromLabel ? <span className="catalog-price-from">{fromLabel} </span> : null}
        <span className={amountClassName}>₽{displayCurrent.toLocaleString()}</span>
      </span>
    );
  }

  const displayWas = effectiveCatalogUnitPriceWithExpansion(basePrice, undefined, destinationId);

  return (
    <span className={`catalog-price-sale ${className}`.trim()}>
      {fromLabel ? <span className="catalog-price-from">{fromLabel} </span> : null}
      <span className="catalog-price-was" aria-hidden>
        ₽{displayWas.toLocaleString()}
      </span>{' '}
      <span className={`catalog-price-now ${amountClassName}`.trim()}>₽{displayCurrent.toLocaleString()}</span>
      <style jsx>{`
        .catalog-price-sale {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 6px;
        }
        .catalog-price-was {
          font-size: 0.82em;
          font-weight: 500;
          color: var(--text-muted, #6b6560);
          text-decoration: line-through;
          opacity: 0.85;
        }
        .catalog-price-now {
          font-weight: 700;
          color: #9f1239;
        }
      `}</style>
    </span>
  );
}
