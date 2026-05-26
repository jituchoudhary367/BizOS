import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import { formatCurrency, getInitials, getRiskColor } from '../../lib/formatters';
import { supabase } from '../../lib/supabaseClient';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const DEMO_CUSTOMERS = [
  { id: 'ccc001', name: 'Gujarat Builders Pvt Ltd', phone: '+919898456789', city: 'Ahmedabad', outstanding_balance: 76000, credit_limit: 150000, risk_score: 0.45, created_at: '2024-06-01' },
  { id: 'ccc002', name: 'Patel Construction Co.', phone: '+919898567890', city: 'Surat', outstanding_balance: 0, credit_limit: 100000, risk_score: 0.12, created_at: '2024-08-15' },
  { id: 'ccc003', name: 'Desai Infraprojects', phone: '+919898678901', city: 'Baroda', outstanding_balance: 48200, credit_limit: 125000, risk_score: 0.52, created_at: '2024-11-20' },
  { id: 'ccc004', name: 'Joshi Civil Engineers', phone: '+919898789012', city: 'Rajkot', outstanding_balance: 0, credit_limit: 90000, risk_score: 0.08, created_at: '2025-01-10' },
  { id: 'ccc005', name: 'Amit Traders', phone: '+919876543211', city: 'Ahmedabad', outstanding_balance: 210000, credit_limit: 250000, risk_score: 0.78, created_at: '2024-03-05' },
  { id: 'ccc006', name: 'Trivedi Paint & Hardware', phone: '+919888234567', city: 'Gandhinagar', outstanding_balance: 12000, credit_limit: 75000, risk_score: 0.30, created_at: '2025-03-20' },
  { id: 'ccc007', name: 'Ravi Electronics & Hardware', phone: '+919877654321', city: 'Ahmedabad', outstanding_balance: 8640, credit_limit: 50000, risk_score: 0.15, created_at: '2025-05-01' },
];

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(DEMO_CUSTOMERS);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, city, credit_limit, outstanding_balance, risk_score, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data?.length) {
      setCustomers(data);
    } else {
      setCustomers(DEMO_CUSTOMERS);
    }
    setLoading(false);
  }, []);

  const { isFlashing } = useRealtimeTable('customers', {
    queryKey: ['customers'],
    onInsert: loadCustomers,
    onUpdate: loadCustomers,
    onDelete: loadCustomers,
  });

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const totalOutstanding = customers.reduce((sum, customer) => sum + Number(customer.outstanding_balance || customer.outstanding || 0), 0);
  const activeCustomers = customers.length;
  const highRiskCustomers = customers.filter((customer) => Number(customer.risk_score || 0) >= 0.5).length;

  const columns = [
    { header: 'Customer', render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center text-[10px] font-medium">{getInitials(r.name)}</div>
        <div>
          <p className="text-xs text-text-primary">{r.name}</p>
          <p className="text-[11px] text-text-tertiary">{r.city}</p>
        </div>
      </div>
    )},
    { header: 'Outstanding', accessor: 'outstanding_balance', render: r => (
      <span className={`font-mono text-xs ${Number(r.outstanding_balance || r.outstanding || 0) > 0 ? 'text-danger' : 'text-text-tertiary'}`}>
        {Number(r.outstanding_balance || r.outstanding || 0) > 0 ? formatCurrency(Number(r.outstanding_balance || r.outstanding || 0)) : '—'}
      </span>
    )},
    { header: 'Credit limit', accessor: 'credit_limit', render: r => <span className="font-mono text-xs text-text-secondary">{formatCurrency(Number(r.credit_limit || 0), { compact: true })}</span> },
    { header: 'Risk', accessor: 'risk_score', render: r => (
      <span className={`font-mono text-xs font-medium ${getRiskColor(r.risk_score)}`}>
        {(r.risk_score * 100).toFixed(0)}%
      </span>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Customers</h1>
          <p className="text-xs text-text-tertiary mt-1">{loading ? 'Syncing live customers...' : `${activeCustomers} live customers`}</p>
        </div>
        <button className="btn-primary text-sm"><Plus size={16} /> Add customer</button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-text-primary font-mono">{activeCustomers}</p>
          <p className="text-xs text-text-tertiary mt-1">Total customers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-success font-mono">{formatCurrency(totalOutstanding, { compact: true })}</p>
          <p className="text-xs text-text-tertiary mt-1">Total outstanding</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-danger font-mono">{highRiskCustomers}</p>
          <p className="text-xs text-text-tertiary mt-1">High-risk customers</p>
        </div>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={customers}
          onRowClick={(r) => navigate(`/app/customers/${r.id}`)}
          searchable
          searchPlaceholder="Search customers..."
          emptyTitle="No customers found"
          emptyDescription="Add your first customer to start tracking orders and payments."
          rowClassName={(row) => (isFlashing?.(row.id) ? 'flash-update' : '')}
        />
      </div>
    </div>
  );
}
