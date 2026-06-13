import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { canChangeStatus } from '@/lib/adminRbac';
import { fetchPartnerById } from '@/lib/db/catalogRead';
import { PartnerFormClient } from '../PartnerFormClient';

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user as { role?: string }).role;
  if (!canChangeStatus(role)) {
    redirect('/admin');
  }

  const { id } = await params;
  const partner = await fetchPartnerById(id);
  if (!partner) notFound();

  return <PartnerFormClient mode="edit" partner={partner} />;
}
