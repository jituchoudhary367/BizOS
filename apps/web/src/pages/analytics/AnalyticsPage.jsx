import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, IndianRupee, Users, Package } from 'lucide-react';
import MetricCard from '../../components/shared/MetricCard';
import RevenueChart from '../../components/charts/RevenueChart';
import CashflowBar from '../../components/charts/CashflowBar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const CATEGORY_DATA = [
  { name: 'Cement', value: 38, color: '#6C63FF' },
  { name: 'Paint', value: 28, color: '#10B981' },
  { name: 'Steel', value: 18, color: '#F59E0B' },
  { name: 'Tiles', value: 10, color: '#EF4444' },
  { name: 'Others', value: 6, color: '#71717A' },
];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    itemsSold: 0,
  });

  const loadMetrics = useCallback(async () => {
    const [ordersResult, customersResult, invoicesResult] = await Promise.all([
      supabase.from('orders').select('id, total_amount', { count: 'exact', head: false }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('id, total_amount', { count: 'exact', head: false }),
    ]);

    setMetrics({
      revenue: (invoicesResult.data || []).reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0),
      orders: ordersResult.count || (ordersResult.data || []).length,
      customers: customersResult.count || 0,
      itemsSold: (ordersResult.data || []).length * 4,
    });
  }, []);

  useRealtimeTable('orders', {
    queryKey: ['analytics-orders'],
    onInsert: loadMetrics,
    onUpdate: loadMetrics,
    onDelete: loadMetrics,
  });

  useRealtimeTable('customers', {
    queryKey: ['analytics-customers'],
    onInsert: loadMetrics,
    onUpdate: loadMetrics,
    onDelete: loadMetrics,
  });

  useRealtimeTable('invoices', {
    queryKey: ['analytics-invoices'],
    onInsert: loadMetrics,
    onUpdate: loadMetrics,
    onDelete: loadMetrics,
  });

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-tertiary mt-0.5">Business intelligence powered by AI</p>
        </div>
        <select className="input w-36 text-xs">
          <option>This month</option>
          <option>Last 3 months</option>
          <option>This year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard index={0} title="Revenue MTD" value={metrics.revenue} previousValue={612000} format="currency" icon={IndianRupee} />
        <MetricCard index={1} title="Orders MTD" value={metrics.orders} previousValue={35} format="number" icon={BarChart3} />
        <MetricCard index={2} title="New customers" value={metrics.customers} previousValue={5} format="number" icon={Users} />
        <MetricCard index={3} title="Items sold" value={metrics.itemsSold} previousValue={1210} format="number" icon={Package} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-medium text-text-primary mb-4">Sales by category</h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {CATEGORY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v}%`}
                contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #1E1E24', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#A1A1AA' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <CashflowBar />
    </div>
  );
}
