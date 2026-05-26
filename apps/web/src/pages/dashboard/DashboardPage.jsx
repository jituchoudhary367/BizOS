import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, ShoppingCart, Package, AlertCircle, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { useNotificationStore } from '../../store';
import MetricCard from '../../components/shared/MetricCard';
import AIInsightBanner from '../../components/shared/AIInsightBanner';
import RevenueChart from '../../components/charts/RevenueChart';
import RealtimeDot from '../../components/shared/RealtimeDot';
import StatusBadge from '../../components/shared/StatusBadge';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { formatCurrency, formatRelativeDate, getInitials } from '../../lib/formatters';
import { DEMO_METRICS } from '../../lib/constants';

const AI_INSIGHTS = [
  { id: 1, title: 'Cement stock will deplete in 3 days', body: 'Berger WeatherCoat has only 4 units left. Based on current velocity, stockout in 3 days. Recommended: Create PO for 15 units.', severity: 'critical' },
  { id: 2, title: 'Amit Traders payment overdue — high risk', body: '₹2,10,000 outstanding for 18 days. Risk score 0.78. Consider calling before next order.', severity: 'warning' },
  { id: 3, title: 'Seasonal demand surge expected', body: 'Historical data shows 35% cement demand increase in June–July. Stock up this week to avoid stockouts.', severity: 'info' },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'order', icon: ShoppingCart, text: 'New order from Patel Construction', detail: '₹28,248 via WhatsApp', time: '3 min ago', color: 'text-success' },
  { id: 2, type: 'invoice', icon: CheckCircle, text: 'Invoice paid by Mehta Home Solutions', detail: '₹15,400 via UPI', time: '1 hr ago', color: 'text-success' },
  { id: 3, type: 'alert', icon: AlertCircle, text: 'Low stock alert: Berger WeatherCoat', detail: 'Only 4 units remaining', time: '2 hr ago', color: 'text-danger' },
  { id: 4, type: 'order', icon: ShoppingCart, text: 'New order from Gujarat Builders', detail: '₹95,000 via WhatsApp', time: '4 hr ago', color: 'text-success' },
  { id: 5, type: 'alert', icon: Clock, text: 'Invoice overdue: Amit Traders', detail: '₹22,800 · 18 days overdue', time: '6 hr ago', color: 'text-warning' },
];

const TOP_CUSTOMERS = [
  { name: 'Gujarat Builders Pvt Ltd', orders: 8, revenue: 380000, risk: 'medium' },
  { name: 'Patel Construction Co.', orders: 12, revenue: 245000, risk: 'low' },
  { name: 'Desai Infraprojects', orders: 6, revenue: 168000, risk: 'medium' },
  { name: 'Joshi Civil Engineers', orders: 5, revenue: 112000, risk: 'low' },
  { name: 'Amit Traders', orders: 9, revenue: 87000, risk: 'high' },
];

const TOP_PRODUCTS = [
  { name: 'UltraTech Cement 50kg', category: 'Cement', sold: 320, revenue: 121600 },
  { name: 'Asian Paints Apex 20L', category: 'Paint', sold: 48, revenue: 163200 },
  { name: 'TMT Steel Bar 12mm', category: 'Steel', sold: 890, revenue: 60520 },
  { name: 'MR Grade Plywood 18mm', category: 'Plywood', sold: 34, revenue: 62900 },
  { name: 'PVC Pipe 1 inch', category: 'Pipes', sold: 680, revenue: 32640 },
];

export default function DashboardPage() {
  // Enable realtime for orders and notifications; play sound for new orders
  const soundEnabled = useNotificationStore(state => state.soundEnabled);
  const { lastEvent: ordersEvent } = useRealtimeTable('orders', { queryKey: ['orders'], sound: soundEnabled });
  useRealtimeTable('ai_insights', { queryKey: ['insights'] });

  // transient toast for new orders
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!ordersEvent) return;
    if (ordersEvent.type === 'INSERT') {
      setToast({ title: `New order from ${ordersEvent.row?.customer_name || 'customer'}`, ts: Date.now() });
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [ordersEvent]);

  return (
    <div>
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <div className="card p-3 shadow-md">
            <div className="text-sm font-medium">{toast.title}</div>
            <div className="text-[11px] text-text-tertiary">Received just now</div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-tertiary mt-0.5">Good morning, Rajesh. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <RealtimeDot />
          <span>Live</span>
        </div>
      </div>

      {/* ─── Row 1: Metric cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          index={0}
          title="Today's revenue"
          value={DEMO_METRICS.todayRevenue}
          previousValue={DEMO_METRICS.yesterdayRevenue}
          format="currency"
          icon={IndianRupee}
        />
        <MetricCard
          index={1}
          title="Pending orders"
          value={DEMO_METRICS.pendingOrders}
          format="number"
          icon={ShoppingCart}
        />
        <MetricCard
          index={2}
          title="Low stock alerts"
          value={DEMO_METRICS.lowStockAlerts}
          format="number"
          icon={Package}
        />
        <MetricCard
          index={3}
          title="Overdue collections"
          value={DEMO_METRICS.overdueCollections}
          format="currency"
          icon={AlertCircle}
        />
      </div>

      {/* ─── Row 2: AI Insights ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-medium text-text-primary">AI insights</h2>
          <span className="badge badge-info">3 active</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hidden">
          {AI_INSIGHTS.map((insight) => (
            <div key={insight.id} className="flex-shrink-0 w-80">
              <AIInsightBanner
                title={insight.title}
                body={insight.body}
                severity={insight.severity}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Row 3: Revenue chart + Activity feed ──────── */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <RevenueChart />
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-text-primary">Recent activity</h3>
            <RealtimeDot />
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon size={14} className={activity.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary truncate">{activity.text}</p>
                    <p className="text-[11px] text-text-tertiary">{activity.detail}</p>
                  </div>
                  <span className="text-[11px] text-text-disabled flex-shrink-0">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ─── Row 4: Top customers + Top products ─────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h3 className="text-sm font-medium text-text-primary mb-4">Top customers — this month</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CUSTOMERS.map((c, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center text-[10px] font-medium">
                        {getInitials(c.name)}
                      </div>
                      <span className="text-text-primary text-xs truncate max-w-[140px]">{c.name}</span>
                    </div>
                  </td>
                  <td>{c.orders}</td>
                  <td className="text-right font-mono text-success text-xs">
                    {formatCurrency(c.revenue, { compact: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5"
        >
          <h3 className="text-sm font-medium text-text-primary mb-4">Top products — by sales volume</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Sold</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div>
                      <p className="text-text-primary text-xs">{p.name}</p>
                      <p className="text-[11px] text-text-tertiary">{p.category}</p>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{p.sold}</td>
                  <td className="text-right font-mono text-success text-xs">
                    {formatCurrency(p.revenue, { compact: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
