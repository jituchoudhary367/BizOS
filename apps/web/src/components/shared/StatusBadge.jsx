import { cn } from '../../lib/utils';
import { getStatusColor } from '../../lib/formatters';

export default function StatusBadge({ status, label }) {
  const colorClass = getStatusColor(status);
  const displayLabel = label || status?.replace(/_/g, ' ');

  return (
    <span className={cn('badge capitalize', colorClass)}>
      {displayLabel}
    </span>
  );
}
