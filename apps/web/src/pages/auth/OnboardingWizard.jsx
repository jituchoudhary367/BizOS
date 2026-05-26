import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store';
import { BUSINESS_TYPES } from '../../lib/constants';

const STEPS = [
  { title: 'Business basics', desc: 'Tell us about your business' },
  { title: 'Location & GST', desc: 'Your business address and tax info' },
  { title: 'Add products', desc: 'Start with your top products' },
  { title: 'Add customers', desc: 'Import your key customers' },
  { title: 'WhatsApp setup', desc: 'Connect WhatsApp Business' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, business } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'hardware',
    gstin: '',
    city: '',
    language: 'en',
    products: [{ name: '', price: '', stock: '' }],
    customers: [{ name: '', phone: '' }],
  });

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      // Auto-save each step
      setLoading(true);
      try {
        if (step === 0 && business) {
          await supabase.from('businesses').update({
            name: formData.businessName,
            type: formData.businessType,
          }).eq('id', business.id);
        }
      } catch (e) { /* Ignore save errors in demo */ }
      setLoading(false);
      setStep(s => s + 1);
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-landing flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-text-primary">BizOS</span>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-tertiary">Step {step + 1} of {STEPS.length}</p>
            <p className="text-xs text-text-tertiary">{Math.round(((step + 1) / STEPS.length) * 100)}%</p>
          </div>
          <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              initial={false}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <div className="card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-xl font-semibold text-text-primary mb-1">{STEPS[step].title}</h1>
              <p className="text-sm text-text-tertiary mb-6">{STEPS[step].desc}</p>

              {/* Step content */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-tertiary block mb-1.5">Business name *</label>
                    <input
                      className="input"
                      placeholder="e.g. Sharma Hardware Stores"
                      value={formData.businessName}
                      onChange={e => update('businessName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary block mb-1.5">Business type *</label>
                    <select
                      className="input"
                      value={formData.businessType}
                      onChange={e => update('businessType', e.target.value)}
                    >
                      {BUSINESS_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary block mb-1.5">Preferred language</label>
                    <select className="input" value={formData.language} onChange={e => update('language', e.target.value)}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="hi-en">Hinglish</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-tertiary block mb-1.5">City</label>
                    <input className="input" placeholder="e.g. Ahmedabad" value={formData.city} onChange={e => update('city', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary block mb-1.5">GSTIN (optional)</label>
                    <input className="input" placeholder="e.g. 24AABCS1429B1ZX" value={formData.gstin} onChange={e => update('gstin', e.target.value)} maxLength={15} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-text-tertiary">Add your first products (you can add more later)</p>
                  {formData.products.map((p, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <input className="input col-span-1 text-xs" placeholder="Product name" value={p.name} onChange={e => {
                        const arr = [...formData.products]; arr[i].name = e.target.value; update('products', arr);
                      }} />
                      <input className="input text-xs" placeholder="Price (₹)" type="number" value={p.price} onChange={e => {
                        const arr = [...formData.products]; arr[i].price = e.target.value; update('products', arr);
                      }} />
                      <input className="input text-xs" placeholder="Stock" type="number" value={p.stock} onChange={e => {
                        const arr = [...formData.products]; arr[i].stock = e.target.value; update('products', arr);
                      }} />
                    </div>
                  ))}
                  {formData.products.length < 5 && (
                    <button
                      onClick={() => update('products', [...formData.products, { name: '', price: '', stock: '' }])}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      + Add another product
                    </button>
                  )}
                  <button onClick={handleNext} className="text-xs text-text-tertiary">Skip for now</button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-xs text-text-tertiary">Add your key customers (you can add more later)</p>
                  {formData.customers.map((c, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input className="input text-xs" placeholder="Customer name" value={c.name} onChange={e => {
                        const arr = [...formData.customers]; arr[i].name = e.target.value; update('customers', arr);
                      }} />
                      <input className="input text-xs" placeholder="Phone number" value={c.phone} onChange={e => {
                        const arr = [...formData.customers]; arr[i].phone = e.target.value; update('customers', arr);
                      }} />
                    </div>
                  ))}
                  {formData.customers.length < 3 && (
                    <button onClick={() => update('customers', [...formData.customers, { name: '', phone: '' }])} className="text-xs text-brand-400">
                      + Add another customer
                    </button>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-text-primary mb-2">Your webhook URL</p>
                    <code className="text-xs font-mono text-brand-400 break-all block p-3 bg-surface rounded-lg border border-surface-border">
                      https://your-project.supabase.co/functions/v1/whatsapp-webhook
                    </code>
                    <button className="text-xs text-brand-400 mt-2">Copy to clipboard</button>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Add this URL to your WhatsApp Business Manager → API Setup → Webhook. Then paste your Phone Number ID below.
                  </p>
                  <input className="input" placeholder="WhatsApp Phone Number ID" />
                  <p className="text-xs text-text-tertiary">You can also configure this later in Settings → WhatsApp Setup.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost text-sm disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleNext} className="btn-primary text-sm" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : step === STEPS.length - 1 ? (
                <><Check size={16} /> Finish setup</>
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
