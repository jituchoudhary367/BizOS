import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, TrendingDown, AlertCircle, Plus, Send, Download } from 'lucide-react';
import MetricCard from '../../components/shared/MetricCard';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import CashflowBar from '../../components/charts/CashflowBar';
import AIInsightBanner from '../../components/shared/AIInsightBanner';
import { formatCurrency, formatDate, getRiskColor } from '../../lib/formatters';
import { supabase } from '../../lib/supabaseClient';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const DEMO_INVOICES = [
  { id: 'iii001', invoice_number: 'INV-2026-0002', customer_name: 'Amit Traders', total_amount: 22800, due_date: '2026-05-13', status: 'overdue', days_overdue: 9 },
  { id: 'iii002', invoice_number: 'INV-2026-0003', customer_name: 'Gujarat Builders', total_amount: 126000, due_date: '2026-05-16', status: 'overdue', days_overdue: 6 },
  { id: 'iii003', invoice_number: 'INV-2026-0010', customer_name: 'Rajput Plumbing', total_amount: 28000, due_date: '2026-05-17', status: 'overdue', days_overdue: 5 },
  { id: 'iii004', invoice_number: 'INV-2026-0004', customer_name: 'Ravi Electronics', total_amount: 8640, due_date: '2026-05-18', status: 'overdue', days_overdue: 4 },
  { id: 'iii005', invoice_number: 'INV-2026-0007', customer_name: 'Shah & Sons Hardware', total_amount: 12300, due_date: '2026-05-24', status: 'sent', days_overdue: 0 },
  { id: 'iii006', invoice_number: 'INV-2026-0008', customer_name: 'Patel Construction', total_amount: 34200, due_date: '2026-05-30', status: 'sent', days_overdue: 0 },
  { id: 'iii007', invoice_number: 'INV-2026-0009', customer_name: 'Joshi Civil Engineers', total_amount: 52800, due_date: '2026-06-02', status: 'draft', days_overdue: 0 },
];

const DEMO_COLLECTIONS = [
  { id: 'c1', name: 'Amit Traders', outstanding: 210000, days_overdue: 18, risk_score: 0.78, last_reminder: '2026-05-19', agent_active: true },
  { id: 'c2', name: 'Gujarat Builders', outstanding: 76000, days_overdue: 6, risk_score: 0.45, last_reminder: '2026-05-21', agent_active: false },
  { id: 'c3', name: 'Rajput Plumbing', outstanding: 55000, days_overdue: 12, risk_score: 0.68, last_reminder: '2026-05-20', agent_active: true },
  { id: 'c4', name: 'Ravi Electronics', outstanding: 42000, days_overdue: 4, risk_score: 0.15, last_reminder: null, agent_active: false },
  { id: 'c5', name: 'Desai Infraprojects', outstanding: 165000, days_overdue: 0, risk_score: 0.52, last_reminder: null, agent_active: false },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [collections, setCollections] = useState(DEMO_COLLECTIONS);

  const loadFinance = useCallback(async () => {
    const [{ data: invoiceRows }, { data: customerRows }] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, customer_id, total_amount, due_date, status, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, name, outstanding_balance, risk_score, updated_at')
        .order('outstanding_balance', { ascending: false }),
    ]);

    if (invoiceRows?.length) setInvoices(invoiceRows);
    else setInvoices(DEMO_INVOICES);

    if (customerRows?.length) {
      setCollections(
        customerRows.map((customer) => ({
          id: customer.id,
          name: customer.name,
          outstanding: Number(customer.outstanding_balance || 0),
          days_overdue: 0,
          risk_score: Number(customer.risk_score || 0),
          last_reminder: null,
          agent_active: Number(customer.outstanding_balance || 0) > 0,
        }))
      );
    } else {
      setCollections(DEMO_COLLECTIONS);
    }
  }, []);

  useRealtimeTable('invoices', {
    queryKey: ['invoices'],
    onInsert: loadFinance,
    onUpdate: loadFinance,
    onDelete: loadFinance,
  });

  useRealtimeTable('customers', {
    queryKey: ['customers'],
    onInsert: loadFinance,
    onUpdate: loadFinance,
    onDelete: loadFinance,
  });

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  const revenueMTD = invoices
    .filter((invoice) => invoice.status !== 'draft')
    .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
  const outstandingTotal = collections.reduce((sum, collection) => sum + Number(collection.outstanding || 0), 0);
  const overdueCount = invoices.filter((invoice) => invoice.status === 'overdue').length;

  const invoiceColumns = [
    { header: 'Invoice #', accessor: 'invoice_number', render: r => <span className="font-mono text-xs text-brand-400">{r.invoice_number}</span> },
    { header: 'Customer', accessor: 'customer_name', render: r => <span className="text-text-primary text-xs">{r.customer_name}</span> },
    { header: 'Amount', accessor: 'total_amount', render: r => <span className="font-mono text-xs">{formatCurrency(r.total_amount)}</span> },
    { header: 'Due date', accessor: 'due_date', render: r => <span className={`text-xs ${r.days_overdue > 0 ? 'text-danger' : 'text-text-secondary'}`}>{formatDate(r.due_date)}</span> },
    { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-2">
        {r.status === 'draft' && <button className="text-xs text-brand-400 hover:text-brand-300">Send</button>}
        <button className="text-xs text-text-tertiary hover:text-text-secondary"><Download size={12} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Finance</h1>
        <button className="btn-primary text-sm"><Plus size={16} /> Create invoice</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit border border-surface-border">
        {['overview', 'invoices', 'ledger', 'collections'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-brand-500 text-white' : 'text-text-tertiary hover:text-text-secondary'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard index={0} title="Revenue MTD" value={revenueMTD} format="currency" icon={IndianRupee} />
            <MetricCard index={1} title="Expenses MTD" value={512400} format="currency" icon={TrendingDown} />
            <MetricCard index={2} title="Net profit MTD" value={revenueMTD - 512400} format="currency" icon={TrendingUp} />
            <MetricCard index={3} title="Outstanding" value={outstandingTotal} format="currency" icon={AlertCircle} />
          </div>
          <AIInsightBanner title="AI CFO insight: Reduce paint overstock" body="You are overstocking low-margin paint (Berger WeatherCoat). Consider reducing your next purchase by 40% and reallocating budget to high-margin steel products." severity="warning" />
          <CashflowBar />
        </motion.div>
      )}

      {/* Invoices tab */}
      {activeTab === 'invoices' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
          <DataTable columns={invoiceColumns} data={invoices} searchable emptyTitle="No invoices" emptyDescription="Create your first invoice from an order." />
        </motion.div>
      )}

      {/* Collections tab */}
      {activeTab === 'collections' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium text-text-primary">Collections agent</h2>
            <span className="badge badge-info">Auto follow-up enabled</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Outstanding</th>
                <th>Days overdue</th>
                <th>Risk</th>
                <th>Agent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id}>
                  <td className="text-text-primary text-xs">{c.name}</td>
                  <td className="font-mono text-xs text-danger">{formatCurrency(c.outstanding)}</td>
                  <td className="text-xs">{c.days_overdue > 0 ? <span className="text-danger">{c.days_overdue}d overdue</span> : <span className="text-text-tertiary">Current</span>}</td>
                  <td>
                    <span className={`font-mono text-xs font-medium ${getRiskColor(c.risk_score)}`}>
                      {(c.risk_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>
                    {c.agent_active
                      ? <span className="badge badge-success text-[11px]">Active</span>
                      : <span className="badge badge-neutral text-[11px]">Off</span>}
                  </td>
                  <td>
                    <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                      <Send size={11} /> Remind
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === 'ledger' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-8 text-center">
          <p className="text-text-tertiary text-sm">Select a customer or supplier to view their ledger. {overdueCount} overdue invoices are currently live.</p>
        </motion.div>
      )}
    </div>
  );
}
