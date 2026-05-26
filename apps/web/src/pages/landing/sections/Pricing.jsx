import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS } from '../../../lib/constants';

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative z-10 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-text-tertiary text-sm uppercase tracking-widest mb-3">Transparent pricing</p>
          <h2 className="text-heading mb-6">Simple pricing.<br />No surprises.</h2>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? 'text-text-primary' : 'text-text-tertiary'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${annual ? 'bg-brand-500' : 'bg-surface-hover'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-text-primary' : 'text-text-tertiary'}`}>
              Annual
              <span className="ml-1.5 text-xs text-success font-medium">save 20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`card p-7 relative ${plan.popular ? 'border-brand-500/60' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap size={11} /> Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-medium text-text-tertiary mb-1">{plan.name}</p>
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary font-mono">
                      ₹{(annual ? plan.annual : plan.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-text-tertiary text-sm">/mo</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-text-primary">Custom</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Check size={15} className="text-success flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="/register"
                className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  plan.popular
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : plan.price
                    ? 'btn-ghost w-full justify-center'
                    : 'btn-ghost w-full justify-center'
                }`}
              >
                {plan.price ? 'Start free trial' : 'Talk to us'}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-text-tertiary mt-8">
          All plans include 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
