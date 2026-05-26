import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency, formatNumber, percentChange } from '../../lib/formatters';

export default function MetricCard({ title, value, previousValue, format = 'currency', icon: Icon, index = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);

  // Animate number counter on mount
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOut cubic
      setDisplayValue(Math.round(numericValue * eased));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [value]);

  const change = previousValue !== undefined ? percentChange(value, previousValue) : null;
  const isPositive = change !== null && change >= 0;

  const formattedValue = format === 'currency'
    ? formatCurrency(displayValue, { compact: displayValue >= 100000 })
    : formatNumber(displayValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: 'easeOut' }}
      className="card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            {title}
          </p>
          <p className="metric-value">{formattedValue}</p>
          {change !== null && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-success' : 'text-danger'
            )}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs yesterday</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <Icon size={20} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
