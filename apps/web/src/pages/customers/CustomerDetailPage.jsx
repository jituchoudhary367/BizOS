import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, IndianRupee, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate, getInitials, getRiskColor } from '../../lib/formatters';

const DEMO = {
  id: 'ccc001', name: 'Gujarat Builders Pvt Ltd', phone: '+919898456789', city: 'Ahmedabad', state: 'Gujarat',
  outstanding: 76000, orders: 18, revenue: 380000, risk_score: 0.45, gstin: '24AABCG1234H1ZX',
  since: '2024-06-01', payment_terms_days: 30,
  recent_orders: [
    { id: 'o1', order_number: 'ORD-2026-0013', total: 95000, status: 'pending', date: '2026-05-21' },
    { id: 'o2', order_number: 'ORD-2026-0008', total: 42000, status: 'delivered', date: '2026-05-14' },
    { id: 'o3', order_number: 'ORD-2026-0001', total: 38000, status: 'delivered', date: '2026-05-08' },
  ],
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = DEMO;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface-raised text-text-tertiary">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-semibold">
            {getInitials(customer.name)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{customer.name}</h1>
            <div className="flex items-center gap-3 text-sm text-text-tertiary">
              <span className="flex items-center gap-1"><MapPin size={12} /> {customer.city}</span>
              <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost text-sm">Send message</button>
          <button className="btn-primary text-sm">Create order</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-text-tertiary mb-1">Total revenue</p><p className="text-lg font-semibold text-text-primary font-mono">{formatCurrency(customer.revenue, { compact: true })}</p></div>
        <div className="card p-4"><p className="text-xs text-text-tertiary mb-1">Outstanding</p><p className={`text-lg font-semibold font-mono ${customer.outstanding > 0 ? 'text-danger' : 'text-text-primary'}`}>{formatCurrency(customer.outstanding)}</p></div>
        <div className="card p-4"><p className="text-xs text-text-tertiary mb-1">Total orders</p><p className="text-lg font-semibold text-text-primary font-mono">{customer.orders}</p></div>
        <div className="card p-4"><p className="text-xs text-text-tertiary mb-1">Risk score</p><p className={`text-lg font-semibold font-mono ${getRiskColor(customer.risk_score)}`}>{(customer.risk_score * 100).toFixed(0)}%</p></div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium text-text-primary mb-4">Recent orders</h2>
        <table className="data-table">
          <thead><tr><th>Order #</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {customer.recent_orders.map(o => (
              <tr key={o.id} className="cursor-pointer" onClick={() => navigate(`/app/orders/${o.id}`)}>
                <td><span className="font-mono text-xs text-brand-400">{o.order_number}</span></td>
                <td><span className="text-xs text-text-tertiary">{formatDate(o.date)}</span></td>
                <td><span className="font-mono text-xs">{formatCurrency(o.total)}</span></td>
                <td><span className={`badge badge-${o.status === 'delivered' ? 'success' : 'warning'}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
