import { motion } from 'framer-motion';
import {
  MessageSquare, TrendingDown, Clock, Users, FileText, BarChart3,
} from 'lucide-react';

const PAIN_POINTS = [
  { icon: MessageSquare, text: 'Orders on WhatsApp, no record', },
  { icon: TrendingDown, text: 'Stock runs out without warning', },
  { icon: Clock, text: 'Customers delay payment forever', },
  { icon: Users, text: 'Staff coordination through voice notes', },
  { icon: FileText, text: 'GST invoices made manually in Tally', },
  { icon: BarChart3, text: 'No idea if you\'re profitable today', },
];

export default function PainPoints() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-text-tertiary text-sm uppercase tracking-widest mb-3">Sound familiar?</p>
          <h2 className="text-heading">The chaos you live in<br />every day.</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAIN_POINTS.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-[#1A0A0A] border border-danger/20 border-l-4 border-l-danger rounded-xl p-5 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-danger" />
                </div>
                <p className="text-sm text-text-secondary leading-snug">{point.text}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Transition statement */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-text-secondary mt-16 text-lg max-w-2xl mx-auto"
        >
          Every one of these problems disappears when your business runs on{' '}
          <span className="text-gradient font-semibold">BizOS</span>.
        </motion.p>
      </div>
    </section>
  );
}
