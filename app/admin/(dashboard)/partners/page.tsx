import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { canChangeStatus } from '@/lib/adminRbac';
import { listCatalogPartnersForAdmin } from '@/lib/db/catalogRead';
import { PartnersListClient } from './PartnersListClient';

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user as { role?: string }).role;
  if (!canChangeStatus(role)) {
    redirect('/admin');
  }

  const params = await searchParams;
  const district = params.district?.trim() ?? '';
  const search = params.q?.trim() ?? '';

  const allPartners = await listCatalogPartnersForAdmin();

  return (
    <PartnersListClient
      allPartners={allPartners}
      initialDistrict={district}
      initialSearch={search}
    />
  );
}
