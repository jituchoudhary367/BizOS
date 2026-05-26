import { PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-disabled" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-tertiary max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
