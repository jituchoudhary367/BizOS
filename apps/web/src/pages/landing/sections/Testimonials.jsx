import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { getInitials } from '../../../lib/formatters';

const TESTIMONIALS = [
  {
    name: 'Mahesh Patel',
    city: 'Surat, Gujarat',
    business: 'Wholesale Textile Distributor',
    quote: 'Pehle din mein 50 WhatsApp orders manually process karta tha. Ab BizOS sab kuch khud karta hai. Invoice bhi, payment reminder bhi. Mera time bach gaya.',
    stars: 5,
  },
  {
    name: 'Suresh Agarwal',
    city: 'Jaipur, Rajasthan',
    business: 'Pharmacy Chain (3 outlets)',
    quote: 'GST filing ke time bahut tension hota tha. BizOS ne sab automatic kar diya. Staff ka attendance bhi track ho raha hai. Really game-changer for us.',
    stars: 5,
  },
  {
    name: 'Priya Mehta',
    city: 'Pune, Maharashtra',
    business: 'FMCG Distributor',
    quote: 'The collections agent is incredible. It follows up with defaulters automatically. Our overdue payments dropped 60% in the first month.',
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-text-tertiary text-sm uppercase tracking-widest mb-3">Social proof</p>
          <h2 className="text-heading">Businesses just like yours<br />are already running smarter.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="card p-6"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} size={14} className="text-warning fill-warning" />
                ))}
              </div>

              <p className="text-sm text-text-secondary leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold">
                  {getInitials(t.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{t.name}</p>
                  <p className="text-[11px] text-text-tertiary">{t.business} · {t.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
