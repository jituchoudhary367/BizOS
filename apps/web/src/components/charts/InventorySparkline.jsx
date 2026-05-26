import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function InventorySparkline({ data, color = '#6C63FF' }) {
  const chartData = useMemo(() => {
    return data?.length > 0 ? data : Array.from({ length: 14 }, (_, i) => ({
      day: i,
      stock: Math.round(50 + Math.random() * 100 - i * 3),
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="stock"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
