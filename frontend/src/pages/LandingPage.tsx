import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  MapPin, Zap, ShieldCheck, BarChart3, ArrowRight,
  Camera, Brain, Bell, CheckCircle2, ChevronRight,
  AlertTriangle, Clock, Users, TrendingUp
} from 'lucide-react';

// ─── Animated Counter ────────────────────────────────────────────────────────
const Counter: React.FC<{ value: number; suffix?: string; label: string }> = ({ value, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const dur = 2000;
    const step = value / (dur / 16);
    let curr = 0;
    const t = setInterval(() => {
      curr = Math.min(curr + step, value);
      setCount(Math.floor(curr));
      if (curr >= value) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-black text-5xl md:text-6xl gradient-text mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-400 font-body uppercase tracking-widest">{label}</div>
    </div>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{
  icon: React.ReactNode; title: string; desc: string;
  accent?: string; delay?: number;
}> = ({ icon, title, desc, accent = 'amber', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="cs-card p-6 group hover-lift"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110
      ${accent === 'amber' ? 'bg-amber/10 border border-amber/20 text-amber' : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'}`}>
      {icon}
    </div>
    <h3 className="font-display text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

// ─── Step ─────────────────────────────────────────────────────────────────────
const Step: React.FC<{ num: string; title: string; desc: string; delay?: number }> = ({ num, title, desc, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="flex gap-5"
  >
    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center">
      <span className="font-display font-black text-amber text-lg">{num}</span>
    </div>
    <div>
      <h4 className="font-display text-lg font-bold text-white mb-1">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-grid noise">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber/6 blur-[120px]" />
          <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/20 rounded-full mb-6"
              >
                <span className="w-1.5 h-1.5 bg-amber rounded-full animate-pulse" />
                <span className="text-amber text-xs font-display uppercase tracking-widest font-semibold">
                  AI-Powered Civic Intelligence
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9]"
              >
                DETECT.<br />
                <span className="gradient-text">REPORT.</span><br />
                RESOLVE.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-lg mb-8 leading-relaxed max-w-md"
              >
                AI detects road damage the moment you snap a photo. Instant severity scoring,
                priority ranking, and direct routing to city officials — so potholes get fixed, not ignored.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <Link to="/register" className="btn-primary px-8 py-3.5 rounded-xl text-base flex items-center gap-2 glow-amber">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/issues" className="btn-secondary px-8 py-3.5 rounded-xl text-base flex items-center gap-2">
                  View Live Map <MapPin size={18} />
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 mt-10 pt-8 border-t border-border"
              >
                {[
                  { icon: ShieldCheck, label: 'Govt Verified' },
                  { icon: Brain, label: 'AI-Powered' },
                  { icon: Bell, label: 'Real-Time Alerts' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-gray-500 text-sm">
                    <Icon size={14} className="text-amber" />
                    <span>{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero Visual — Live Feed Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="cs-card p-1 rounded-2xl overflow-hidden glow-amber">
                  {/* Fake image area */}
                  <div className="relative bg-bg-elevated rounded-xl overflow-hidden h-72 scan-container">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-cyan-500/5" />
                    {/* Road damage illustration */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber/30 animate-spin" style={{ animationDuration: '20s' }} />
                        <div className="absolute inset-4 rounded-full border border-amber/20" />
                        <div className="absolute inset-8 bg-amber/5 rounded-full flex items-center justify-center">
                          <Camera size={40} className="text-amber/60" />
                        </div>
                        {/* Detection box */}
                        <div className="absolute top-6 left-10 w-16 h-14 border-2 border-severity-critical rounded-sm opacity-80">
                          <div className="absolute -top-5 left-0 text-xs font-mono text-red-400 whitespace-nowrap">POTHOLE 94.2%</div>
                          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-400" />
                          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-400" />
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400" />
                        </div>
                      </div>
                    </div>
                    {/* Status bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-bg-primary/80 backdrop-blur px-4 py-2 flex items-center gap-3">
                      <span className="w-2 h-2 bg-severity-critical rounded-full animate-pulse" />
                      <span className="text-xs font-mono text-red-400">CRITICAL DAMAGE DETECTED</span>
                      <span className="ml-auto text-xs font-mono text-gray-500">PRIORITY: 89/100</span>
                    </div>
                  </div>
                  {/* Analysis results */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-lg font-bold text-white">Pothole — MG Road</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />Ward 14, Pune</p>
                      </div>
                      <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-display uppercase text-red-400 tracking-wider">Critical</span>
                    </div>
                    {[
                      { label: 'Severity Score', val: 89, color: '#EF4444' },
                      { label: 'AI Confidence', val: 94, color: '#06B6D4' },
                    ].map(b => (
                      <div key={b.label}>
                        <div className="flex justify-between mb-1 text-xs text-gray-500">
                          <span>{b.label}</span><span style={{ color: b.color }}>{b.val}%</span>
                        </div>
                        <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${b.val}%`, background: b.color, boxShadow: `0 0 8px ${b.color}66` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating notification */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 glass-amber px-4 py-2.5 rounded-xl shadow-elevated"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span className="text-xs font-body font-semibold text-white">Issue Assigned!</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">PWD Dept notified • 2s ago</p>
                </motion.div>

                {/* Floating stat */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                  className="absolute -bottom-4 -left-4 glass px-4 py-2.5 rounded-xl shadow-elevated"
                >
                  <div className="text-xs text-gray-400 mb-0.5">Avg Fix Time</div>
                  <div className="font-display text-xl font-bold text-amber">4.2 Days</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 border-y border-border bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <Counter value={12847} suffix="+" label="Issues Reported" />
            <Counter value={9621}  suffix="+" label="Issues Resolved" />
            <Counter value={47}    suffix=""  label="Cities Active" />
            <Counter value={98}    suffix="%" label="AI Accuracy" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-amber text-sm font-display uppercase tracking-[0.3em] mb-4 block">Why CrowdSense</span>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white">
              INFRASTRUCTURE<br /><span className="gradient-text">INTELLIGENCE</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard delay={0}    icon={<Brain size={22} />}      accent="amber" title="AI Damage Detection"       desc="Upload a photo and our PyTorch model instantly detects, classifies, and scores road damage with 98% accuracy." />
            <FeatureCard delay={0.08} icon={<BarChart3 size={22} />}  accent="cyan"  title="Priority Scoring"          desc="Every issue gets a 0-100 priority score based on severity, traffic density, and location risk — no manual triage." />
            <FeatureCard delay={0.16} icon={<MapPin size={22} />}     accent="amber" title="Geo-Mapped Issues"          desc="All reports are plotted on an interactive map with PostGIS-powered spatial querying and ward-level heatmaps." />
            <FeatureCard delay={0.24} icon={<Bell size={22} />}       accent="cyan"  title="Real-Time Alerts"           desc="Citizens get notified when their issue is assigned, actioned, or resolved. Officials get SLA breach warnings." />
            <FeatureCard delay={0.32} icon={<ShieldCheck size={22} />}accent="amber" title="Verified Reporting"         desc="Photo + GPS + timestamp make every report audit-proof. Duplicate detection prevents system abuse." />
            <FeatureCard delay={0.40} icon={<TrendingUp size={22} />} accent="cyan"  title="Analytics Dashboard"        desc="City officials get ward-wise breakdowns, resolution trends, contractor performance, and budget forecasting." />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-amber text-sm font-display uppercase tracking-[0.3em] mb-4 block">How It Works</span>
                <h2 className="font-display text-5xl font-black text-white mb-12">
                  FROM PHOTO<br />TO <span className="gradient-text">FIX</span>
                </h2>
              </motion.div>
              <div className="space-y-8">
                <Step delay={0.1}  num="01" title="Snap & Submit"    desc="Take a photo of any road damage. CrowdSense auto-captures GPS coordinates and timestamps the report." />
                <Step delay={0.2}  num="02" title="AI Analyzes"      desc="Our deep learning model scans the image, detects damage type, estimates area, and assigns a severity score in under 3 seconds." />
                <Step delay={0.3}  num="03" title="Priority Queued"  desc="The system ranks all open issues by priority score. Critical potholes jump to the top — no bureaucratic delays." />
                <Step delay={0.4}  num="04" title="Official Notified" desc="The right city department gets an alert with full AI report, location pin, and suggested repair cost estimate." />
                <Step delay={0.5}  num="05" title="Track & Resolve"  desc="Citizens track real-time status updates. Upon resolution, the issue is marked closed with photographic proof." />
              </div>
            </div>

            {/* Visual timeline */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {[
                { icon: Camera,        label: 'Photo Captured',   sub: 'GPS: 18.5204°N, 73.8567°E',  color: 'amber', time: '14:32:01' },
                { icon: Brain,         label: 'AI Processing',    sub: 'Model: YOLOv8 + Classifier',  color: 'cyan',  time: '14:32:04' },
                { icon: AlertTriangle, label: 'CRITICAL Detected', sub: 'Severity: 89 | Priority: 94', color: 'red',   time: '14:32:04' },
                { icon: Bell,          label: 'PWD Dept Notified', sub: 'SLA: 48h | Assigned: Rajan', color: 'purple',time: '14:32:05' },
                { icon: Clock,         label: 'Work in Progress',  sub: 'Contractor: ARC Infra',       color: 'orange',time: 'Day 2' },
                { icon: CheckCircle2,  label: 'Issue Resolved',    sub: 'Citizen rated 4.5/5 ⭐',      color: 'green', time: 'Day 3' },
              ].map((item, i) => {
                const colorMap: Record<string, string> = {
                  amber: 'bg-amber/10 border-amber/20 text-amber',
                  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
                  red: 'bg-red-500/10 border-red-500/20 text-red-400',
                  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
                  green: 'bg-green-500/10 border-green-500/20 text-green-400',
                };
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="cs-card p-3.5 flex items-center gap-3"
                  >
                    <div className={`p-2 rounded-lg border flex-shrink-0 ${colorMap[item.color]}`}>
                      <item.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">{item.sub}</p>
                    </div>
                    <span className="text-xs font-mono text-gray-600 flex-shrink-0">{item.time}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="cs-card p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-hero-gradient opacity-60" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/20 rounded-full mb-6">
                <Users size={12} className="text-amber" />
                <span className="text-amber text-xs font-display uppercase tracking-widest">Join 50,000+ Citizens</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-4">
                YOUR CITY.<br /><span className="gradient-text">YOUR VOICE.</span>
              </h2>
              <p className="text-gray-400 mb-8 text-lg max-w-lg mx-auto">
                Stop tolerating bad roads. One photo is all it takes to start the repair process.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/register" className="btn-primary px-10 py-4 rounded-xl text-base flex items-center gap-2 glow-amber">
                  Report Your First Issue <ChevronRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary px-10 py-4 rounded-xl text-base">
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber rounded flex items-center justify-center">
              <MapPin size={12} className="text-white" />
            </div>
            <span className="font-display text-sm font-bold tracking-wider text-white">CROWD<span className="text-amber">SENSE</span></span>
          </div>
          <p className="text-xs text-gray-600">© 2025 CrowdSense. AI-Powered Civic Infrastructure Management.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <a href="#" className="hover:text-amber transition">Privacy</a>
            <a href="#" className="hover:text-amber transition">Terms</a>
            <a href="#" className="hover:text-amber transition">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
