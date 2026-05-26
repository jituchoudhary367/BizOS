import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPhone, verifyOtp, signInWithGoogle, loading } = useAuthStore();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formatted = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const { success, error } = await signInWithPhone(formatted);
    if (success) setStep('otp');
    else setError(error);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formatted = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const { success, error } = await verifyOtp(formatted, otp);
    if (success) navigate('/app/dashboard');
    else setError(error);
  };

  // Demo shortcut
  const handleDemoLogin = () => {
    useAuthStore.getState().setDemoMode();
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-landing flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <span className="text-white font-bold">B</span>
          </div>
          <span className="font-semibold text-xl text-text-primary">BizOS</span>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-1">
            {step === 'phone' ? 'Sign in to BizOS' : 'Enter OTP'}
          </h1>
          <p className="text-sm text-text-tertiary mb-6">
            {step === 'phone' ? 'Enter your mobile number to continue.' : `We sent a code to +91 ${phone}`}
          </p>

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary mb-1.5 block">Mobile number</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-surface border border-r-0 border-surface-border rounded-l-lg text-sm text-text-secondary">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="input rounded-l-none"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary mb-1.5 block">6-digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  className="input text-center text-xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & sign in'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="text-xs text-text-tertiary w-full text-center">
                Wrong number? Go back
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-text-disabled">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <button onClick={handleDemoLogin} className="btn-ghost w-full justify-center text-sm mb-2">
            Continue with demo account
          </button>
          <button onClick={signInWithGoogle} className="btn-ghost w-full justify-center text-sm">
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-4">
          New to BizOS?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300">Create account</Link>
        </p>
      </motion.div>
    </div>
  );
}
