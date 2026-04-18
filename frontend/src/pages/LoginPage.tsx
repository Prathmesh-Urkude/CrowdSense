import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
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

          {/* Google OAuth */}
          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-border" />
              <span className="px-3 text-xs text-gray-500 font-display uppercase tracking-widest">or</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <button
              type="button"
              onClick={() => authAPI.googleRedirect()}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated transition text-sm text-gray-200 font-medium"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
