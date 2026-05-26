import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="text-sm font-semibold text-text-primary font-mono">
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }) {
  // Demo data if none provided
  const chartData = useMemo(() => {
    return data?.length > 0 ? data : Array.from({ length: 30 }, (_, i) => ({
      date: `May ${i + 1}`,
      revenue: Math.round(40000 + Math.random() * 120000),
    }));
  }, [data]);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">Revenue — last 30 days</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717A', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717A', fontSize: 11 }}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108, 99, 255, 0.05)' }} />
          <Bar
            dataKey="revenue"
            fill="#6C63FF"
            radius={[4, 4, 0, 0]}
            opacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
