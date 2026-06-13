import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n';

export default async function PartnerApplyPage({
  params,
}: {
  params: { lang: string };
}) {
  const lang = params.lang;
  if (!isValidLocale(lang)) notFound();

  // Public partner apply hidden for Russia MVP — admin enters partners directly.
  notFound();
}
