import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Filter, Search } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import RealtimeDot from '../../components/shared/RealtimeDot';
import { formatCurrency, formatDate, formatRelativeDate } from '../../lib/formatters';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const DEMO_ORDERS = [
  { id: 'ooo00001-0000-0000-0000-000000000015', order_number: 'ORD-2026-0015', customer_name: 'Ravi Electronics & Hardware', items_count: 2, total_amount: 5400, source: 'whatsapp', status: 'pending', created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000014', order_number: 'ORD-2026-0014', customer_name: 'Desai Infraprojects', items_count: 4, total_amount: 42000, source: 'manual', status: 'pending', created_at: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000013', order_number: 'ORD-2026-0013', customer_name: 'Gujarat Builders Pvt Ltd', items_count: 6, total_amount: 95000, source: 'whatsapp', status: 'pending', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000012', order_number: 'ORD-2026-0012', customer_name: 'Trivedi Paint & Hardware', items_count: 3, total_amount: 9800, source: 'whatsapp', status: 'pending', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000011', order_number: 'ORD-2026-0011', customer_name: 'Rajput Plumbing Works', items_count: 2, total_amount: 7200, source: 'voice', status: 'confirmed', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000010', order_number: 'ORD-2026-0010', customer_name: 'Amit Traders', items_count: 3, total_amount: 18500, source: 'whatsapp', status: 'confirmed', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000009', order_number: 'ORD-2026-0009', customer_name: 'Joshi Civil Engineers', items_count: 5, total_amount: 52800, source: 'manual', status: 'processing', created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'ooo00001-0000-0000-0000-000000000008', order_number: 'ORD-2026-0008', customer_name: 'Patel Construction Co.', items_count: 4, total_amount: 34200, source: 'whatsapp', status: 'dispatched', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
];

const SOURCE_STYLES = {
  whatsapp: 'bg-success/10 text-success',
  manual: 'bg-brand-500/10 text-brand-400',
  api: 'bg-surface-hover text-text-tertiary',
  voice: 'bg-warning/10 text-warning',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const { isFlashing } = useRealtimeTable('orders', { queryKey: ['orders'] });

  const columns = [
    { header: 'Order #', accessor: 'order_number', render: (row) => (
      <span className="font-mono text-xs text-brand-400">{row.order_number}</span>
    )},
    { header: 'Customer', accessor: 'customer_name', render: (row) => (
      <span className="text-text-primary text-xs">{row.customer_name}</span>
    )},
    { header: 'Items', accessor: 'items_count', render: (row) => (
      <span className="text-text-tertiary text-xs">{row.items_count} items</span>
    )},
    { header: 'Amount', accessor: 'total_amount', render: (row) => (
      <span className="font-mono text-xs text-text-primary">{formatCurrency(row.total_amount)}</span>
    )},
    { header: 'Source', accessor: 'source', render: (row) => (
      <span className={`badge text-[11px] ${SOURCE_STYLES[row.source]}`}>{row.source}</span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <StatusBadge status={row.status} />
    )},
    { header: 'Date', accessor: 'created_at', render: (row) => (
      <span className="text-text-tertiary text-xs">{formatRelativeDate(row.created_at)}</span>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Orders</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <RealtimeDot />
            <span className="text-xs text-text-tertiary">Live updates enabled</span>
          </div>
        </div>
        <button className="btn-primary text-sm">
          <Plus size={16} /> New order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit border border-surface-border">
        {['all', 'whatsapp', 'manual', 'purchase'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-brand-500 text-white' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab === 'all' ? 'All orders' : tab === 'whatsapp' ? 'WhatsApp feed' : tab === 'manual' ? 'Manual entry' : 'Purchase orders'}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={DEMO_ORDERS}
          onRowClick={(row) => navigate(`/app/orders/${row.id}`)}
          searchable
          searchPlaceholder="Search orders by customer or order number..."
          emptyTitle="No orders found"
          emptyDescription="Create your first order or connect WhatsApp to receive orders automatically."
          rowClassName={(row) => (isFlashing?.(row.id) ? 'flash-update' : '')}
        />
      </div>
    </div>
  );
}
