import { motion } from 'framer-motion';
import {
  MessageSquare, Brain, Package, IndianRupee, FileText,
  Contact, TrendingUp, Mic, Languages,
} from 'lucide-react';


const FEATURES = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Order Intelligence',
    desc: 'Every WhatsApp message becomes a structured order. Hindi, Hinglish, English — all parsed instantly with 95%+ accuracy.',
    size: 'large',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: Brain,
    title: 'AI Business Brain',
    desc: 'Ask anything about your business in plain language. Get answers, create invoices, check stock — all through conversation.',
    size: 'large',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    desc: 'Real-time stock levels with AI demand forecasting. Know before you run out.',
    size: 'medium',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: IndianRupee,
    title: 'Autonomous Collections',
    desc: 'AI agent follows up on overdue payments via WhatsApp automatically.',
    size: 'medium',
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
  {
    icon: FileText,
    title: 'GST Invoice Generation',
    desc: 'CGST + SGST or IGST auto-computed from HSN codes. PDF generated instantly.',
    size: 'medium',
    color: 'text-brand-300',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Contact,
    title: 'Staff & Attendance',

    desc: 'GPS check-in, tasks, Kanban boards.',
    size: 'small',
    color: 'text-text-secondary',
    bg: 'bg-surface-hover',
  },
  {
    icon: TrendingUp,
    title: 'AI Cashflow Insights',
    desc: 'Know your profitability today, not month-end.',
    size: 'small',
    color: 'text-text-secondary',
    bg: 'bg-surface-hover',
  },
  {
    icon: Mic,
    title: 'Voice Note Understanding',
    desc: 'Record. BizOS listens and acts.',
    size: 'small',
    color: 'text-text-secondary',
    bg: 'bg-surface-hover',
  },
  {
    icon: Languages,
    title: 'Hindi + English NLP',
    desc: 'Devanagari, Roman, or mixed — it understands.',
    size: 'small',
    color: 'text-text-secondary',
    bg: 'bg-surface-hover',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative z-10 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-text-tertiary text-sm uppercase tracking-widest mb-3">Everything you need</p>
          <h2 className="text-heading">Everything your business needs,<br />nothing it doesn't.</h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const colSpan = feature.size === 'large' ? 'col-span-2' : feature.size === 'medium' ? 'col-span-1 lg:col-span-1' : 'col-span-1';
            const minHeight = feature.size === 'large' ? 'min-h-[220px]' : feature.size === 'medium' ? 'min-h-[160px]' : 'min-h-[130px]';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={`card p-6 ${colSpan} ${minHeight} flex flex-col group hover:border-brand-500/30 transition-all duration-300`}
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className={feature.color} />
                </div>
                <h3 className={`font-semibold text-text-primary mb-2 ${feature.size === 'large' ? 'text-lg' : 'text-sm'}`}>
                  {feature.title}
                </h3>
                <p className={`text-text-secondary leading-relaxed ${feature.size === 'large' ? 'text-sm' : 'text-xs'}`}>
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
