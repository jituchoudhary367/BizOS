import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function AIInsightBanner({ title, body, severity = 'info', onDismiss, className }) {
  const severityStyles = {
    info: 'border-l-brand-500 bg-brand-500/5',
    warning: 'border-l-warning bg-warning/5',
    critical: 'border-l-danger bg-danger/5',
  };

  const iconColors = {
    info: 'text-brand-400',
    warning: 'text-warning',
    critical: 'text-danger',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'border-l-4 rounded-r-xl p-4 flex items-start gap-3',
        severityStyles[severity],
        className
      )}
    >
      <Sparkles size={18} className={cn('mt-0.5 flex-shrink-0', iconColors[severity])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{body}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-text-disabled hover:text-text-secondary text-xs flex-shrink-0"
        >
          Dismiss
        </button>
      )}
    </motion.div>
  );
}
