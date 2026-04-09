import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-grid noise">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-bg-secondary border-r border-border">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber/8 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 blur-[80px] rounded-full" />
        </div>
        <div className="relative text-center px-12 max-w-md">
          <div className="w-16 h-16 bg-amber rounded-2xl flex items-center justify-center mx-auto mb-6 glow-amber">
            <MapPin size={28} className="text-white" />
          </div>
          <h2 className="font-display text-5xl font-black text-white mb-4 leading-tight">
            EVERY ROAD<br />TELLS A <span className="gradient-text">STORY.</span>
          </h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Join thousands of citizens making their cities safer, one report at a time.
          </p>
          {/* Fake stat cards */}
          <div className="space-y-3">
            {[
              { label: 'Issues resolved this month', val: '1,247', up: true },
              { label: 'Avg resolution time', val: '4.2 days', up: true },
              { label: 'Critical issues pending', val: '38', up: false },
            ].map(s => (
              <div key={s.label} className="cs-card px-4 py-3 flex items-center justify-between text-left">
                <span className="text-sm text-gray-400">{s.label}</span>
                <span className={`font-display font-bold text-sm ${s.up ? 'text-green-400' : 'text-red-400'}`}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center">
              <MapPin size={15} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-wider text-white">
              CROWD<span className="text-amber">SENSE</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl font-black text-white mb-2">SIGN IN</h1>
            <p className="text-gray-400 text-sm">Don't have an account? <Link to="/register" className="text-amber hover:underline">Create one free</Link></p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="cs-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-display uppercase tracking-widest text-gray-400">Password</label>
                <a href="#" className="text-xs text-amber hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cs-input w-full pl-11 pr-12 py-3.5 rounded-xl text-sm"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="spinner w-5 h-5 border-2" /><span>Signing In...</span></>
              ) : (
                <><span>Sign In</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Demo logins */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-gray-500 text-center mb-3 font-display uppercase tracking-widest">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Citizen', email: 'citizen@demo.com', pw: 'demo123' },
                { role: 'Admin', email: 'admin@demo.com', pw: 'demo123' },
              ].map(d => (
                <button
                  key={d.role}
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                  className="btn-secondary py-2 px-3 rounded-lg text-xs"
                >
                  Demo {d.role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
