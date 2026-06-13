'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { canChangeStatus } from '@/lib/adminRbac';
import {
  createCatalogPartnerCrm,
  setCatalogPartnerStatus,
  updateCatalogPartnerCrm,
  type CatalogPartnerCrmInput,
} from '@/lib/catalogWrite';
import { hasAnyContact } from '@/lib/partnerContactLinks';

async function requirePartnerEditor(): Promise<{ error?: string } | { ok: true }> {
  const session = await auth();
  if (!session?.user || !canChangeStatus((session.user as { role?: string }).role)) {
    return { error: 'Forbidden' };
  }
  return { ok: true };
}

function parsePartnerCrmInput(formData: FormData): CatalogPartnerCrmInput | { error: string } {
  const shopName = String(formData.get('shopName') ?? '').trim();
  const contactName = String(formData.get('contactName') ?? '').trim();
  const phoneNumber = String(formData.get('phoneNumber') ?? '').trim();
  const telegram = String(formData.get('telegram') ?? '').trim();
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();

  if (!shopName) return { error: 'Укажите название магазина' };
  if (!contactName) return { error: 'Укажите контактное лицо' };
  if (!hasAnyContact({ phoneNumber, telegram, whatsapp })) {
    return { error: 'Нужен хотя бы один способ связи: телефон, Telegram или WhatsApp' };
  }

  const stockCategories = String(formData.get('stockCategories') ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  const flowersInStock = String(formData.get('flowersInStock') ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return {
    shopName,
    contactName,
    phoneNumber,
    telegram: telegram || undefined,
    whatsapp: whatsapp || undefined,
    shopAddress: String(formData.get('shopAddress') ?? '').trim() || undefined,
    district: String(formData.get('district') ?? '').trim() || undefined,
    stockCategories,
    flowersInStock,
    internalNotes: String(formData.get('internalNotes') ?? '').trim() || undefined,
    selfDeliver: formData.get('selfDeliver') === 'true',
    deliveryZones: String(formData.get('deliveryZones') ?? '').trim() || undefined,
    prepTimeNote: String(formData.get('prepTimeNote') ?? '').trim() || undefined,
  };
}

export async function createPartnerCrmAction(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const gate = await requirePartnerEditor();
  if ('error' in gate) return gate;

  const parsed = parsePartnerCrmInput(formData);
  if ('error' in parsed) return parsed;

  try {
    const id = await createCatalogPartnerCrm(parsed);
    revalidatePath('/admin/partners');
    return { id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось сохранить партнёра' };
  }
}

export async function updatePartnerCrmAction(
  partnerId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const gate = await requirePartnerEditor();
  if ('error' in gate) return gate;

  const parsed = parsePartnerCrmInput(formData);
  if ('error' in parsed) return parsed;

  try {
    await updateCatalogPartnerCrm(partnerId, parsed);
    revalidatePath('/admin/partners');
    revalidatePath(`/admin/partners/${partnerId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось обновить партнёра' };
  }
}

export async function setPartnerStatusAction(
  partnerId: string,
  status: 'approved' | 'disabled'
): Promise<{ error?: string }> {
  const gate = await requirePartnerEditor();
  if ('error' in gate) return gate;

  try {
    await setCatalogPartnerStatus(partnerId, status);
    revalidatePath('/admin/partners');
    revalidatePath(`/admin/partners/${partnerId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Не удалось изменить статус' };
  }
}
