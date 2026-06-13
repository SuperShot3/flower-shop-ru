/** Normalize partner contact fields into tap-friendly URLs. */

export function phoneTelHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits;
  return `tel:+${normalized}`;
}

export function telegramHref(handle: string | null | undefined): string | null {
  const raw = (handle ?? '').trim().replace(/^@/, '').replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '');
  if (!raw) return null;
  return `https://t.me/${raw}`;
}

export function whatsappHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export function hasAnyContact(input: {
  phoneNumber?: string;
  telegram?: string;
  whatsapp?: string;
}): boolean {
  return Boolean(
    phoneTelHref(input.phoneNumber) || telegramHref(input.telegram) || whatsappHref(input.whatsapp)
  );
}
