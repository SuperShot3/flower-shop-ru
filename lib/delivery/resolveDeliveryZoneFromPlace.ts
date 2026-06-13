/**
 * Server-side delivery zone suggestion from Places / coordinates.
 * Fee always comes from destination + resolved zone — never trust client fee.
 */

import { detectDistrictFromAddress } from '@/lib/deliveryFees';
import type { OrderDeliveryDestinationId } from '@/lib/orders';
import {
  ekbZoneIdFromLegacyDistrict,
  findZoneDef,
  getZonesForDestination,
  isSupportedZone,
} from '@/lib/delivery/zones';

const EKB_BOUNDS = {
  south: 56.68,
  north: 56.92,
  west: 60.42,
  east: 60.78,
};

/** Historical city centre (rough heuristic for address-only inference). */
const EKB_CENTRAL_BOUNDS = {
  south: 56.82,
  north: 56.855,
  west: 60.57,
  east: 60.64,
};

function inBounds(
  lat: number,
  lng: number,
  b: { south: number; north: number; west: number; east: number }
): boolean {
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

function zoneFromPostcodeAllowlist(
  destinationId: OrderDeliveryDestinationId,
  postalCode: string
): string | null {
  for (const z of getZonesForDestination(destinationId)) {
    if (z.postalCodes?.includes(postalCode)) return z.id;
    if (
      z.postalPrefixes?.some((p) => {
        const prefix = p.replace(/\D/g, '');
        return prefix.length > 0 && postalCode.startsWith(prefix);
      })
    ) {
      return z.id;
    }
  }
  return null;
}

export type ResolveDeliveryZoneInput = {
  deliveryDestination: OrderDeliveryDestinationId;
  /** Customer-selected zone (hint only when inference fails). */
  clientZoneId: string;
  address?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  postalCode?: string | null;
  province?: string | null;
};

/**
 * Authoritative zone id for pricing. Falls back to supported client zone, then destination default unknown.
 */
export function resolveDeliveryZoneFromPlace(input: ResolveDeliveryZoneInput): string {
  const { deliveryDestination, clientZoneId } = input;
  const text = [input.formattedAddress, input.address].filter(Boolean).join(' ').trim();

  if (input.postalCode?.trim()) {
    const fromPostal = zoneFromPostcodeAllowlist(
      deliveryDestination,
      input.postalCode.trim()
    );
    if (fromPostal && isSupportedZone(deliveryDestination, fromPostal)) {
      return fromPostal;
    }
  }

  if (deliveryDestination === 'CHIANG_MAI') {
    const detected = text ? detectDistrictFromAddress(text) : null;
    if (detected) {
      const zoneId = ekbZoneIdFromLegacyDistrict(detected);
      if (zoneId && isSupportedZone('CHIANG_MAI', zoneId)) return zoneId;
    }

    if (typeof input.lat === 'number' && typeof input.lng === 'number') {
      if (!inBounds(input.lat, input.lng, EKB_BOUNDS)) {
        if (isSupportedZone('CHIANG_MAI', 'ekb-unknown')) return 'ekb-unknown';
      } else if (inBounds(input.lat, input.lng, EKB_CENTRAL_BOUNDS)) {
        if (isSupportedZone('CHIANG_MAI', 'ekb-zheleznodorozhny')) {
          return 'ekb-zheleznodorozhny';
        }
      } else if (isSupportedZone('CHIANG_MAI', 'ekb-unknown')) {
        return 'ekb-unknown';
      }
    }
  }

  if (
    clientZoneId &&
    isSupportedZone(deliveryDestination, clientZoneId) &&
    findZoneDef(deliveryDestination, clientZoneId)
  ) {
    return clientZoneId;
  }

  const zones = getZonesForDestination(deliveryDestination);
  const unknown = zones.find((z) => z.id.includes('unknown')) ?? zones[zones.length - 1];
  return unknown?.id ?? clientZoneId;
}
