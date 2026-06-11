import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { CartPageLoading } from './CartPageLoading';

const CartPageClient = dynamic(
  () => import('./CartPageClient').then((m) => m.CartPageClient),
  { ssr: false, loading: () => <CartPageLoading /> }
);

export default function CartPage({
  params,
}: {
  params: { lang: string };
}) {
  const lang = params.lang;
  if (!isValidLocale(lang)) notFound();
  return <CartPageClient lang={lang as Locale} />;
}
