import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Package, FileText, IndianRupee } from 'lucide-react';

const CONVERSATION = [
  { from: 'customer', text: 'Sharma ji, 50 bag ACC cement aur 10 tin Asian Paints bhej do', delay: 0 },
  { from: 'system', text: '📨 Message received — parsing intent...', delay: 1200, type: 'processing' },
  { from: 'ai', text: '✅ Order #ORD-2026-0099 created\n• ACC Cement 50kg × 50 bags = ₹18,500\n• Asian Paints Apex 4L × 10 tins = ₹7,200\nTotal: ₹25,700 + GST', delay: 2400 },
];

const SIDE_EVENTS = [
  { icon: Package, label: 'Stock reserved', detail: 'ACC Cement: 85 → 35 bags', color: 'text-warning', delay: 2200 },
  { icon: FileText, label: 'Invoice draft created', detail: 'INV-2026-0099 · ₹30,346', color: 'text-brand-400', delay: 2600 },
  { icon: IndianRupee, label: 'Ledger updated', detail: 'Gujarat Builders outstanding +₹30,346', color: 'text-success', delay: 3000 },
  { icon: Check, label: 'Confirmation sent', detail: 'WhatsApp reply sent to customer', color: 'text-success', delay: 3400 },
];

export default function WhatsAppDemo() {
  const [chatMessages, setChatMessages] = useState([]);
  const [sideEvents, setSideEvents] = useState([]);
  const [active, setActive] = useState(false);
  const timerRefs = useRef([]);

  const runDemo = () => {
    // Clear previous
    timerRefs.current.forEach(clearTimeout);
    setChatMessages([]);
    setSideEvents([]);
    setActive(true);

    CONVERSATION.forEach((msg) => {
      const t = setTimeout(() => setChatMessages(prev => [...prev, msg]), msg.delay);
      timerRefs.current.push(t);
    });

    SIDE_EVENTS.forEach((evt) => {
      const t = setTimeout(() => setSideEvents(prev => [...prev, evt]), evt.delay);
      timerRefs.current.push(t);
    });

    const reset = setTimeout(() => setActive(false), 6000);
    timerRefs.current.push(reset);
  };

  useEffect(() => () => timerRefs.current.forEach(clearTimeout), []);

  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-text-tertiary text-sm uppercase tracking-widest mb-3">Live demo</p>
          <h2 className="text-heading">See it process a real order.</h2>
        </motion.div>

        <div className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden shadow-glow-md">
          {/* Demo header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-danger" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-text-tertiary ml-2">BizOS — Live Order Processing</span>
            </div>
            <button
              onClick={runDemo}
              disabled={active}
              className="btn-primary text-xs px-4 py-1.5"
            >
              {active ? 'Processing...' : '▶ Run demo'}
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left — WhatsApp chat */}
            <div className="p-6 border-r border-surface-border">
              <p className="text-xs text-text-tertiary mb-4 uppercase tracking-wider">WhatsApp conversation</p>
              <div className="space-y-3 min-h-[200px]">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.from === 'customer' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.from === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs whitespace-pre-line ${
                      msg.from === 'customer'
                        ? 'bg-[#005C4B] text-[#E9EEE4] rounded-br-sm'
                        : msg.type === 'processing'
                        ? 'bg-surface text-text-tertiary italic rounded-bl-sm'
                        : 'bg-surface-hover text-text-primary rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right — System events */}
            <div className="p-6">
              <p className="text-xs text-text-tertiary mb-4 uppercase tracking-wider">System — real-time events</p>
              <div className="space-y-3 min-h-[200px]">
                {sideEvents.map((evt, i) => {
                  const Icon = evt.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-surface-border"
                    >
                      <Icon size={16} className={evt.color} />
                      <div>
                        <p className="text-xs font-medium text-text-primary">{evt.label}</p>
                        <p className="text-[11px] text-text-tertiary">{evt.detail}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
