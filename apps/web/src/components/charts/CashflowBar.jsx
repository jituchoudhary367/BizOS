import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-text-tertiary mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CashflowBar({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { month: 'Jan', income: 580000, expense: 420000 },
    { month: 'Feb', income: 620000, expense: 440000 },
    { month: 'Mar', income: 710000, expense: 480000 },
    { month: 'Apr', income: 680000, expense: 460000 },
    { month: 'May', income: 750000, expense: 510000 },
  ];

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">Cashflow — income vs expense</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={16} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717A', fontSize: 11 }}
            tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108, 99, 255, 0.05)' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#A1A1AA' }}
          />
          <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
