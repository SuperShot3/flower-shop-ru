import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, translations, type Locale } from '@/lib/i18n';
import { ContactPageClient } from './ContactPageClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return { title: 'Ланна Блум' };
  const t = translations[lang as Locale].contact;
  const brand = lang === 'ru' ? 'Ланна Блум' : 'Lanna Bloom';
  return { title: `${t.title} | ${brand}` };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  return <ContactPageClient lang={lang as Locale} />;
}
