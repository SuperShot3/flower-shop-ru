'use client';

type BadgeProps = {
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'submitted' | 'needs_changes';
  labelRu?: string;
  labelEn?: string;
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'pending',
  approved: 'approved',
  active: 'active',
  rejected: 'rejected',
  submitted: 'submitted',
  needs_changes: 'needs_changes',
};

export function Badge({ status, labelRu, labelEn }: BadgeProps) {
  const cls = STATUS_CLASS[status] || 'pending';
  return (
    <span className={`partner-badge partner-badge--${cls}`}>
      {labelRu ?? status}
      {labelEn && <span className="partner-badge-en">{labelEn}</span>}
    </span>
  );
}
