import type { OrderDeliveryDestinationId } from '@/lib/orders';

/** Farther satellite cities — optional item markup (v1 manual fees; multiplier reserved). */
export const EXPANSION_MARKUP_DESTINATIONS = new Set<OrderDeliveryDestinationId>([
  'PERVOURALSK',
  'ARAMIL',
]);

export const EXPANSION_MARKUP_MULTIPLIER = 1.3;

export function roundToNearest10(amountRub: number): number {
  if (!Number.isFinite(amountRub)) return 0;
  return Math.round(amountRub / 10) * 10;
}

export function applyExpansionItemMarkup(
  amountRub: number,
  destination: OrderDeliveryDestinationId
): number {
  if (!Number.isFinite(amountRub)) return 0;
  if (!EXPANSION_MARKUP_DESTINATIONS.has(destination)) return Math.round(amountRub);
  return roundToNearest10(amountRub * EXPANSION_MARKUP_MULTIPLIER);
}
