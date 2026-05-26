import { cn } from '../../lib/utils';

export default function RealtimeDot({ className }) {
  return (
    <span className={cn('relative flex h-2.5 w-2.5', className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-40" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
    </span>
  );
}
