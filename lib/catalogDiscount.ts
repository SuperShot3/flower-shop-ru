import type { DeliveryDestinationId } from '@/lib/delivery/markets';
import { applyExpansionItemMarkup } from '@/lib/expansionMarkup';

/** Parse CMS discount; returns undefined when inactive. */
export function normalizeCatalogDiscountPercent(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  const n = Math.round(raw);
  if (n < 1 || n > 90) return undefined;
  return n;
}

export function hasCatalogDiscount(discountPercent?: number): boolean {
  return normalizeCatalogDiscountPercent(discountPercent) != null;
}

/** Round down to whole RUB (storefront + checkout). */
export function applyCatalogDiscount(priceRub: number, discountPercent?: number): number {
  const pct = normalizeCatalogDiscountPercent(discountPercent);
  if (!pct || priceRub <= 0) return Math.max(0, Math.round(priceRub));
  return Math.max(0, Math.floor((priceRub * (100 - pct)) / 100));
}

export function effectiveCatalogUnitPrice(
  basePrice: number,
  discountPercent?: number
): number {
  return applyCatalogDiscount(basePrice, discountPercent);
}

export function effectiveCatalogUnitPriceWithExpansion(
  basePrice: number,
  discountPercent: number | undefined,
  destinationId: DeliveryDestinationId
): number {
  return applyExpansionItemMarkup(
    applyCatalogDiscount(basePrice, discountPercent),
    destinationId
  );
}

export function minDiscountedPriceFromOptions(
  prices: number[],
  discountPercent?: number
): number {
  if (!prices.length) return 0;
  return Math.min(...prices.map((p) => applyCatalogDiscount(p, discountPercent)));
}
