import { cn } from '@/lib/utils';
import type { POStatus } from '@/types/erp';

const statusConfig: Record<POStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'erp-badge-draft' },
  pending: { label: 'Pending', className: 'erp-badge-pending' },
  approved: { label: 'Approved', className: 'erp-badge-approved' },
  cancelled: { label: 'Cancelled', className: 'erp-badge-cancelled' },
};

export default function StatusBadge({ status }: { status: POStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
