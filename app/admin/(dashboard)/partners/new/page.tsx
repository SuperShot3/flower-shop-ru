import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { canChangeStatus } from '@/lib/adminRbac';
import { PartnerFormClient } from '../PartnerFormClient';

export default async function AdminNewPartnerPage() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user as { role?: string }).role;
  if (!canChangeStatus(role)) {
    redirect('/admin');
  }

  return <PartnerFormClient mode="create" />;
}
