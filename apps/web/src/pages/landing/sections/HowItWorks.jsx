import { motion } from 'framer-motion';
import { Upload, Brain, MessageSquare } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    number: '01',
    title: 'Connect WhatsApp + upload your data',
    desc: 'Scan your WhatsApp Business number. Upload existing data — Excel sheets, PDF price lists, Tally exports. BizOS handles it.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Brain,
    number: '02',
    title: 'AI learns your business',
    desc: 'Within minutes, BizOS knows your products, customers, suppliers, pricing, and payment terms — exactly as you operate.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: MessageSquare,
    number: '03',
    title: 'Operate in plain language',
    desc: '"How much does Patel owe me?" "Create invoice for today\'s orders." "Which cement is running low?" Just ask. Or let agents handle it automatically.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-text-tertiary text-sm uppercase tracking-widest mb-3">Three steps, then autopilot</p>
          <h2 className="text-heading">Up and running<br />in one afternoon.</h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-gradient-to-r from-brand-500/30 via-success/30 to-warning/30" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="card p-8 relative"
              >
                {/* Step number */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className={step.color} />
                  </div>
                  <span className="text-3xl font-bold text-surface-hover">{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
