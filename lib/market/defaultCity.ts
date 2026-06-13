/**
 * Primary service city for EKB Flowers MVP.
 * Launch in Yekaterinburg only; more cities can be added later.
 */
export const PRIMARY_SERVICE_CITY_EN = 'Yekaterinburg' as const;

/** Russian display name (for copy / future `ru` locale). */
export const PRIMARY_SERVICE_CITY_RU = 'Екатеринбург' as const;

/** Default ITU calling code for checkout phone fields (Russia). */
export const DEFAULT_CHECKOUT_COUNTRY_CODE = '7' as const;

/** Legacy Thailand fork stored +66 — map to Russia for persisted cart forms. */
export function normalizeCheckoutCountryCode(code: string | undefined): string {
  const digits = code?.replace(/\D/g, '') ?? '';
  if (!digits || digits === '66') return DEFAULT_CHECKOUT_COUNTRY_CODE;
  return digits;
}
