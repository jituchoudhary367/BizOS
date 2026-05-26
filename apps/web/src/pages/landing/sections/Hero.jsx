import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Check } from 'lucide-react';

const WHATSAPP_MESSAGES = [
  { id: 1, from: 'customer', name: 'Patel Construction', text: 'Bhai 20 cement aur 5 Asian Paints 20L bhej dena kal tak 🙏', delay: 0 },
  { id: 2, from: 'ai', text: '⚡ Parsing order...', delay: 1500, isProcessing: true },
  { id: 3, from: 'ai', text: '✅ Order confirmed!\n\n📦 Order #ORD-2026-0042\n• UltraTech Cement 50kg × 20 = ₹7,600\n• Asian Paints Apex 20L × 5 = ₹17,000\n\n💰 Total: ₹24,600 + GST = ₹28,248\n🚚 Delivery: Tomorrow by 2 PM\n📄 Invoice: bit.ly/inv-042', delay: 3000 },
];

export default function Hero() {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const showNext = () => {
      if (currentIndex < WHATSAPP_MESSAGES.length) {
        const msg = WHATSAPP_MESSAGES[currentIndex];
        timerRef.current = setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg]);
          setCurrentIndex(i => i + 1);
        }, msg.delay);
      } else {
        // Reset loop after 2s pause
        timerRef.current = setTimeout(() => {
          setVisibleMessages([]);
          setCurrentIndex(0);
        }, 2000);
      }
    };
    showNext();
    return () => clearTimeout(timerRef.current);
  }, [currentIndex]);

  return (
    <section className="relative z-10 min-h-screen flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
          {/* Left — Copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-text-tertiary text-lg mb-3 leading-relaxed"
            >
              Your business runs on WhatsApp chats and handwritten bills.
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-display leading-none mb-6"
            >
              Now it runs on{' '}
              <span className="text-gradient">AI.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-lg leading-relaxed mb-8 max-w-lg"
            >
              BizOS understands your business the way you actually operate — in Hindi, in voice notes, in chaos. No forms. No training. Just results.
            </motion.p>

            {/* Feature bullets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col gap-2 mb-8"
            >
              {[
                'WhatsApp orders → instant invoices',
                'Hindi, English, Hinglish — all understood',
                'Stock alerts before you run out',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check size={16} className="text-success flex-shrink-0" />
                  {item}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="/register"
                className="btn-primary px-8 py-3 text-base"
                id="hero-get-early-access"
              >
                Get early access
              </a>
              <button
                className="btn-ghost px-6 py-3 text-base flex items-center gap-2"
                id="hero-watch-demo"
              >
                <PlayCircle size={20} className="text-brand-400" />
                Watch 2-min demo
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-text-disabled mt-4"
            >
              Free for 14 days · No credit card · Cancel anytime
            </motion.p>
          </div>

          {/* Right — Animated WhatsApp mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center"
          >
            <WhatsAppMockup messages={visibleMessages} />
          </motion.div>
        </div>
      </div>

      {/* Glow behind hero */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}

function WhatsAppMockup({ messages }) {
  return (
    <div className="w-full max-w-sm">
      {/* Phone frame */}
      <div className="bg-[#111B21] rounded-3xl overflow-hidden border border-surface-border shadow-2xl">
        {/* WhatsApp header */}
        <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400">
            PC
          </div>
          <div>
            <p className="text-sm font-medium text-[#E9EEE4]">Patel Construction</p>
            <p className="text-[11px] text-[#8696A0]">online</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-success animate-ping" />
        </div>

        {/* Messages */}
        <div className="px-3 py-4 min-h-[300px] space-y-3 bg-[#0B141A]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        >
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.from === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-line ${
                  msg.from === 'customer'
                    ? 'bg-[#005C4B] text-[#E9EEE4] rounded-br-sm'
                    : msg.isProcessing
                    ? 'bg-[#1F2C34] text-[#8696A0] italic rounded-bl-sm'
                    : 'bg-[#1F2C34] text-[#E9EEE4] rounded-bl-sm'
                }`}
              >
                {msg.text}
                {!msg.isProcessing && (
                  <span className="text-[9px] text-[#8696A0] ml-2 float-right mt-1">
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {messages.length > 0 && messages.length < WHATSAPP_MESSAGES.length && (
            <div className="flex justify-start">
              <div className="bg-[#1F2C34] px-4 py-2.5 rounded-lg rounded-bl-sm flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#8696A0] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-xs text-text-tertiary mt-4">
        Real order, parsed in under 1 second ⚡
      </p>
    </div>
  );
}
