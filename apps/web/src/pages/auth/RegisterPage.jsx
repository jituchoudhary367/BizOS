import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-landing flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <span className="text-white font-bold">B</span>
          </div>
          <span className="font-semibold text-xl text-text-primary">BizOS</span>
        </div>
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-1">Create your account</h1>
          <p className="text-sm text-text-tertiary mb-6">Start your 14-day free trial. No credit card required.</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-tertiary block mb-1.5">Full name</label>
              <input className="input" placeholder="Rajesh Sharma" />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-1.5">Mobile number</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-surface border border-r-0 border-surface-border rounded-l-lg text-sm text-text-secondary">+91</span>
                <input type="tel" className="input rounded-l-none" placeholder="98765 43210" maxLength={10} />
              </div>
            </div>
            <Link to="/onboarding" className="btn-primary w-full justify-center flex items-center gap-2">
              Create account <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-center text-xs text-text-tertiary mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
