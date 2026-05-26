import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import RealtimeDot from '../../components/shared/RealtimeDot';
import AIInsightBanner from '../../components/shared/AIInsightBanner';
import InventorySparkline from '../../components/charts/InventorySparkline';
import { formatCurrency } from '../../lib/formatters';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const DEMO_PRODUCTS = [
  { id: 'aaa00001-0000-0000-0000-000000000001', sku: 'CEM-ULT-50', name: 'UltraTech Cement 50kg', category: 'Cement', stock: 120, reorder_level: 50, buying_price: 320, selling_price: 380, status: 'normal' },
  { id: 'aaa00001-0000-0000-0000-000000000002', sku: 'CEM-ACC-50', name: 'ACC Cement 50kg', category: 'Cement', stock: 85, reorder_level: 50, buying_price: 310, selling_price: 370, status: 'normal' },
  { id: 'aaa00001-0000-0000-0000-000000000003', sku: 'PNT-ASN-20', name: 'Asian Paints Apex 20L', category: 'Paint', stock: 6, reorder_level: 10, buying_price: 2800, selling_price: 3400, status: 'low' },
  { id: 'aaa00001-0000-0000-0000-000000000004', sku: 'PNT-ASN-04', name: 'Asian Paints Tractor 4L', category: 'Paint', stock: 18, reorder_level: 20, buying_price: 580, selling_price: 720, status: 'low' },
  { id: 'aaa00001-0000-0000-0000-000000000005', sku: 'PNT-BRG-20', name: 'Berger WeatherCoat 20L', category: 'Paint', stock: 4, reorder_level: 8, buying_price: 2600, selling_price: 3200, status: 'critical' },
  { id: 'aaa00001-0000-0000-0000-000000000009', sku: 'STL-TMT-12', name: 'TMT Steel Bar 12mm', category: 'Steel', stock: 1200, reorder_level: 500, buying_price: 55, selling_price: 68, status: 'normal' },
  { id: 'aaa00001-0000-0000-0000-000000000016', sku: 'TIL-VIT-02', name: 'Vitrified Tiles 2x2 ft', category: 'Tiles', stock: 22, reorder_level: 30, buying_price: 380, selling_price: 520, status: 'low' },
  { id: 'aaa00001-0000-0000-0000-000000000017', sku: 'PLY-MR-18', name: 'MR Grade Plywood 18mm', category: 'Plywood', stock: 12, reorder_level: 15, buying_price: 1400, selling_price: 1850, status: 'low' },
];

const STOCK_STATUS = {
  normal: { label: 'Healthy', class: 'badge-success' },
  low: { label: 'Low', class: 'badge-warning' },
  critical: { label: 'Critical', class: 'badge-danger' },
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('products');
  const { isFlashing } = useRealtimeTable('inventory_stock', { queryKey: ['inventory'] });

  const columns = [
    { header: 'SKU', accessor: 'sku', render: (r) => <span className="font-mono text-xs text-text-tertiary">{r.sku}</span> },
    { header: 'Product', accessor: 'name', render: (r) => (
      <div>
        <p className="text-xs text-text-primary">{r.name}</p>
        <p className="text-[11px] text-text-tertiary">{r.category}</p>
      </div>
    )},
    { header: 'Stock', accessor: 'stock', render: (r) => (
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-text-primary">{r.stock}</span>
        <div className="w-20"><InventorySparkline color={r.status === 'critical' ? '#EF4444' : r.status === 'low' ? '#F59E0B' : '#10B981'} /></div>
      </div>
    )},
    { header: 'Reorder at', accessor: 'reorder_level', render: (r) => <span className="font-mono text-xs text-text-tertiary">{r.reorder_level}</span> },
    { header: 'Buy price', accessor: 'buying_price', render: (r) => <span className="font-mono text-xs">{formatCurrency(r.buying_price)}</span> },
    { header: 'Sell price', accessor: 'selling_price', render: (r) => <span className="font-mono text-xs">{formatCurrency(r.selling_price)}</span> },
    { header: 'Status', accessor: 'status', render: (r) => (
      <span className={`badge ${STOCK_STATUS[r.status]?.class}`}>{STOCK_STATUS[r.status]?.label}</span>
    )},
  ];

  const criticalCount = DEMO_PRODUCTS.filter(p => p.status === 'critical').length;
  const lowCount = DEMO_PRODUCTS.filter(p => p.status === 'low').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Inventory</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <RealtimeDot />
            <span className="text-xs text-text-tertiary">Live stock updates</span>
            {(criticalCount + lowCount) > 0 && (
              <span className="flex items-center gap-1 text-xs text-warning">
                <AlertTriangle size={12} /> {criticalCount + lowCount} items need attention
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm">Import CSV</button>
          <button className="btn-primary text-sm"><Plus size={16} /> Add product</button>
        </div>
      </div>

      {/* AI insight */}
      <AIInsightBanner
        className="mb-5"
        title="Berger WeatherCoat is critically low — 4 units, stockout in 3 days"
        body="Based on current demand (2.3 units/week), you'll run out by May 25. I've prepared a draft PO for 15 units from Gujarat Paint Distributors."
        severity="critical"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit border border-surface-border">
        {['products', 'stock', 'forecasts', 'purchase-orders'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${activeTab === tab ? 'bg-brand-500 text-white' : 'text-text-tertiary hover:text-text-secondary'}`}>
            {tab === 'products' ? 'Products' : tab === 'stock' ? 'Stock levels' : tab === 'forecasts' ? 'AI forecasts' : 'Purchase orders'}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={DEMO_PRODUCTS}
          searchable
          searchPlaceholder="Search products..."
          emptyTitle="No products found"
          emptyDescription="Add your first product to start tracking inventory."
          rowClassName={(row) => (isFlashing?.(row.id) ? 'flash-update' : '')}
        />
      </div>
    </div>
  );
}
