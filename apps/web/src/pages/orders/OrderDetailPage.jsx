import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useNotificationStore } from '../../store';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { ArrowLeft, CheckCircle, Clock, Package, Truck, MapPin, MessageSquare } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';

const DEMO_ORDER = {
  id: 'ooo00001-0000-0000-0000-000000000013',
  order_number: 'ORD-2026-0013',
  customer_name: 'Gujarat Builders Pvt Ltd',
  customer_phone: '+919898456789',
  status: 'pending',
  source: 'whatsapp',
  total_amount: 95000,
  tax_amount: 14400,
  discount_amount: 5000,
  delivery_date: '2026-05-24',
  notes: 'Deliver to Bodakdev project site, contact Ramesh on arrival.',
  created_at: new Date(Date.now() - 86400000).toISOString(),
  items: [
    { id: 1, product_name: 'UltraTech Cement 50kg', quantity: 100, unit_price: 380, line_total: 38000, tax_rate: 28 },
    { id: 2, product_name: 'TMT Steel Bar 12mm', quantity: 500, unit_price: 68, line_total: 34000, tax_rate: 18 },
    { id: 3, product_name: 'River Sand (per bag)', quantity: 80, unit_price: 55, line_total: 4400, tax_rate: 5 },
    { id: 4, product_name: 'PVC Pipe 1 inch', quantity: 200, unit_price: 48, line_total: 9600, tax_rate: 18 },
  ],
  whatsapp_message: 'Need 100 bags UltraTech cement, 500kg TMT 12mm, 80 bags river sand and 200ft PVC pipe 1 inch for the Bodakdev project. Delivery to site directly.',
  timeline: [
    { status: 'pending', label: 'Order created', time: new Date(Date.now() - 86400000).toISOString(), done: true },
    { status: 'confirmed', label: 'Order confirmed', time: null, done: false },
    { status: 'processing', label: 'Being processed', time: null, done: false },
    { status: 'dispatched', label: 'Dispatched', time: null, done: false },
    { status: 'delivered', label: 'Delivered', time: null, done: false },
  ],
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(DEMO_ORDER);

  // Subscribe to realtime updates for this order and update local state
  const soundEnabled = useNotificationStore(state => state.soundEnabled);
  const { lastEvent, isFlashing } = useRealtimeTable('orders', { filter: `id=eq.${id}`, queryKey: ['orders'], sound: soundEnabled });

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.row?.id !== id) return;

    if (lastEvent.type === 'INSERT') {
      setOrder(lastEvent.row);
    }
    if (lastEvent.type === 'UPDATE') {
      setOrder((prev) => ({ ...prev, ...lastEvent.row }));
    }
    if (lastEvent.type === 'DELETE') {
      // If deleted, navigate back to list
      navigate('/app/orders');
    }
  }, [lastEvent, id, navigate]);

  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ status }) => apiClient.patch(`/orders/${id}/status`, { status }),
    onMutate: async ({ status }) => {
        await queryClient.cancelQueries({ queryKey: ['orders'] });
        const previous = queryClient.getQueryData(['orders']);
        // Optimistically update orders list cache
        queryClient.setQueryData(['orders'], (old) => {
          if (!old) return old;
          return { ...old, data: old.data.map(o => o.id === id ? { ...o, status } : o) };
        });
        // Update local order state immediately
        setOrder((prev) => ({ ...prev, status }));
        return { previous };
      },
      onError: (err, variables, context) => {
        // rollback
        if (context?.previous) queryClient.setQueryData(['orders'], context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      },
    }
  );

  const updateStatus = (status) => {
    statusMutation.mutate({ status });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface-raised text-text-tertiary">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-text-primary font-mono">{order.order_number}</h1>
            <StatusBadge status={order.status} />
            <span className={`badge bg-success/10 text-success text-xs`}>{order.source}</span>
          </div>
          <p className="text-sm text-text-tertiary mt-0.5">{order.customer_name}</p>
        </div>
        <div className="flex gap-2">
          {order.status !== 'confirmed' && (
            <button onClick={() => updateStatus('confirmed')} className="btn-ghost text-sm">Confirm</button>
          )}
          <button onClick={() => updateStatus('cancelled')} className="btn-ghost text-sm">Cancel</button>
          <button onClick={() => updateStatus('dispatched')} className="btn-primary text-sm">Mark dispatched</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left col — items + invoice */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order items */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-text-primary mb-4">Order items</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>GST</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-text-primary text-xs">{item.product_name}</td>
                    <td className="font-mono text-xs">{item.quantity}</td>
                    <td className="font-mono text-xs">{formatCurrency(item.unit_price)}</td>
                    <td className="text-xs">{item.tax_rate}%</td>
                    <td className="text-right font-mono text-xs text-text-primary">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-surface-border mt-4 pt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.total_amount - order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>GST</span>
                <span className="font-mono">{formatCurrency(order.tax_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-success">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-text-primary pt-2 border-t border-surface-border">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp message */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-success" /> Original WhatsApp message
            </h2>
            <div className="bg-[#1B3A2D] rounded-xl p-4 text-sm text-[#E9EEE4] leading-relaxed">
              &ldquo;{order.whatsapp_message}&rdquo;
            </div>
            <p className="text-xs text-text-tertiary mt-2">From: {order.customer_phone}</p>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-text-primary mb-3">Notes</h2>
            <p className="text-sm text-text-secondary">{order.notes}</p>
          </div>
        </div>

        {/* Right col — timeline + info */}
        <div className="space-y-5">
          {/* Order info */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-medium text-text-primary mb-1">Order details</h2>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-text-tertiary" />
              <span className="text-text-secondary">Delivery: {formatDate(order.delivery_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-text-tertiary" />
              <span className="text-text-secondary">Created: {formatDate(order.created_at)}</span>
            </div>
          </div>

          {/* Status timeline */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-text-primary mb-4">Timeline</h2>
            <div className="space-y-4">
              {order.timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step.done ? 'bg-success/20' : 'bg-surface-hover'}`}>
                      <CheckCircle size={14} className={step.done ? 'text-success' : 'text-text-disabled'} />
                    </div>
                    {i < order.timeline.length - 1 && (
                      <div className={`w-px flex-1 mt-1 ${step.done ? 'bg-success/30' : 'bg-surface-border'}`} style={{ minHeight: 24 }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-xs font-medium ${step.done ? 'text-text-primary' : 'text-text-disabled'}`}>{step.label}</p>
                    {step.time && <p className="text-[11px] text-text-tertiary">{formatDate(step.time)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <h2 className="text-sm font-medium text-text-primary mb-3">Actions</h2>
            <button className="btn-primary w-full justify-center text-sm">Generate invoice</button>
            <button className="btn-ghost w-full justify-center text-sm">Resend confirmation</button>
            <button className="btn-ghost w-full justify-center text-sm text-danger border-danger/30 hover:border-danger/60">Cancel order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
