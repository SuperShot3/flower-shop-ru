import { redirect } from 'next/navigation';

/** Legacy Thailand approve flow — replaced by /admin/partners CRM. */
export default function AdminPartnerApplicationsRedirectPage() {
  redirect('/admin/partners');
}
