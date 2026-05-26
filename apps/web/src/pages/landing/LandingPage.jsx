import Hero from './sections/Hero';
import PainPoints from './sections/PainPoints';
import HowItWorks from './sections/HowItWorks';
import Features from './sections/Features';
import WhatsAppDemo from './sections/WhatsAppDemo';
import Testimonials from './sections/Testimonials';
import Pricing from './sections/Pricing';
import Footer from './sections/Footer';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const canvasRef = useRef(null);

  // Particle grid background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(108, 99, 255, 0.08)';
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(108, 99, 255, ${0.03 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="bg-landing text-text-primary grain-overlay relative">
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* Navbar */}
      <Navbar />

      {/* Sections */}
      <Hero />
      <PainPoints />
      <HowItWorks />
      <Features />
      <WhatsAppDemo />
      <Testimonials />
      <Pricing />

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-heading mb-6"
          >
            Your competitors are still using WhatsApp manually.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary text-lg mb-8"
          >
            Start your free 14-day trial. No credit card required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <a href="/register" className="btn-primary text-base px-8 py-3">
              Start free trial
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────
function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="backdrop-blur-xl bg-landing/80 border-b border-surface-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-semibold text-text-primary">BizOS</span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                How it works
              </a>
              <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Pricing
              </a>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <a href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline">
                Sign in
              </a>
              <a href="/register" className="btn-primary text-sm">
                Start free
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
