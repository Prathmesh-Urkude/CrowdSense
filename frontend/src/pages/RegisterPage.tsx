import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, MapPin, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PERKS = [
  'AI-powered damage detection in seconds',
  'Real-time tracking of your reports',
  'Direct line to city officials',
  'Ward-level issue heatmaps',
];

const InputRow: React.FC<{
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, icon, children }) => (
  <div>
    <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
        {icon}
      </div>
      {children}
    </div>
  </div>
);

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to CrowdSense.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-grid noise">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden items-center justify-center bg-bg-secondary border-r border-border">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-amber/6 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-cyan-500/5 blur-[80px] rounded-full" />
        </div>
        <div className="relative px-12 max-w-sm">
          <div className="mb-8">
            <div className="w-14 h-14 bg-amber rounded-2xl flex items-center justify-center mb-5 glow-amber">
              <MapPin size={24} className="text-white" />
            </div>
            <h2 className="font-display text-4xl font-black text-white mb-3 leading-tight">
              BE THE<br /><span className="gradient-text">CHANGE.</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Citizens who report issues are the engine of civic improvement.
              Every photo you submit powers a smarter city.
            </p>
          </div>
          <div className="space-y-3">
            {PERKS.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 size={16} className="text-amber flex-shrink-0" />
                <span className="text-sm text-gray-300">{p}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-20 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-amber rounded-lg flex items-center justify-center">
              <MapPin size={13} className="text-white" />
            </div>
            <span className="font-display text-base font-bold tracking-wider text-white">
              CROWD<span className="text-amber">SENSE</span>
            </span>
          </Link>

          <div className="mb-7">
            <h1 className="font-display text-4xl font-black text-white mb-2">CREATE ACCOUNT</h1>
            <p className="text-gray-400 text-sm">Already registered? <Link to="/login" className="text-amber hover:underline">Sign in</Link></p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputRow label="Full Name" icon={<User size={15} />}>
              <input
                type="text" required value={form.username} onChange={update('username')}
                placeholder="Prathmesh Urkude"
                className="cs-input w-full pl-10 pr-4 py-3.5 rounded-xl text-sm"
              />
            </InputRow>

            <InputRow label="Email Address" icon={<Mail size={15} />}>
              <input
                type="email" required value={form.email} onChange={update('email')}
                placeholder="you@example.com"
                className="cs-input w-full pl-10 pr-4 py-3.5 rounded-xl text-sm"
              />
            </InputRow>

            <InputRow label="Password" icon={<Lock size={15} />}>
              <input
                type={showPw ? 'text' : 'password'}
                required value={form.password} onChange={update('password')}
                placeholder="Minimum 6 characters"
                className="cs-input w-full pl-10 pr-12 py-3.5 rounded-xl text-sm"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </InputRow>

            {/* Password strength */}
            {form.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${form.password.length >= i * 3
                        ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-amber' : 'bg-green-400'
                        : 'bg-bg-elevated'
                      }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {form.password.length < 4 ? 'Too short' : form.password.length < 7 ? 'Weak' : form.password.length < 10 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}

            <div className="flex items-start gap-3 py-1">
              <input type="checkbox" required id="terms" className="mt-0.5 accent-amber" />
              <label htmlFor="terms" className="text-xs text-gray-400">
                I agree to the <a href="#" className="text-amber hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-amber hover:underline">Privacy Policy</a>. My reports will be shared with city authorities.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="spinner w-5 h-5 border-2" /><span>Creating Account...</span></>
              ) : (
                <><span>Create Account</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
