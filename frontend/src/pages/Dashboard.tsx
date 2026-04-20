import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Clock, Plus,
  MapPin, ArrowRight, TrendingUp, Zap, Filter,
  ThumbsUp, Calendar, Activity,
} from 'lucide-react';
import { SeverityBadge, StatusBadge, PriorityRing } from '../components/SeverityBadge';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, upvoteAPI } from '../utils/api';
import type { BackendReport } from '../types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ─── Chart mock data (kept as placeholder until backend delivers chart endpoints) ─
const ACTIVITY_DATA = [
  { day: 'Mon', reported: 24, resolved: 18 },
  { day: 'Tue', reported: 31, resolved: 22 },
  { day: 'Wed', reported: 18, resolved: 29 },
  { day: 'Thu', reported: 42, resolved: 35 },
  { day: 'Fri', reported: 38, resolved: 31 },
  { day: 'Sat', reported: 55, resolved: 28 },
  { day: 'Sun', reported: 29, resolved: 24 },
];

const SEVERITY_DATA = [
  { name: 'Critical', value: 18, color: '#EF4444' },
  { name: 'High', value: 67, color: '#F97316' },
  { name: 'Medium', value: 142, color: '#F59E0B' },
  { name: 'Low', value: 120, color: '#22C55E' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityFromScore = (score: number): 'critical' | 'high' | 'medium' | 'low' =>
  score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-4 py-3 rounded-xl border border-border text-xs">
      <p className="font-display font-semibold text-white mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

// ─── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;       // tailwind color token e.g. 'amber', 'red', 'green'
  delta?: string;
  deltaUp?: boolean;
  suffix?: string;
  gradient?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, icon: Icon, accent, delta, deltaUp, suffix = '', gradient,
}) => {
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/20' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/20' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  };
  const c = colorMap[accent] ?? colorMap.amber;

  return (
    <div className={`cs-card p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200 shadow-lg ${c.glow}`}>
      {/* Gradient backdrop */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${gradient ?? ''}`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${c.bg} ${c.border}`}>
          <Icon size={18} className={c.text} />
        </div>
        {delta && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${deltaUp
            ? 'text-green-400 bg-green-500/10 border-green-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
            }`}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>

      <div className="font-display text-3xl font-black text-white leading-none mb-1">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        {suffix && <span className="text-base font-bold text-gray-400 ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-gray-500 font-medium tracking-wide">{label}</div>

      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.bg} opacity-60`} />
    </div>
  );
};

// ─── Report Mini-Card ─────────────────────────────────────────────────────────
const ReportCard: React.FC<{ report: BackendReport; index: number }> = ({ report, index }) => {
  const [upvoted, setUpvoted] = useState<boolean | null>(null);
  const [count, setCount] = useState(report.upvote_count ?? 0);
  const sev = severityFromScore(report.severity_score);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await upvoteAPI.getStatus(report.id);
        if (mounted) {
          setUpvoted(res.data.upvoted);
        }
      } catch {
        setUpvoted(false); // fallback
      }
    };
    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [report.id]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (upvoted === null) return; // not ready yet

    try {
      const next = !upvoted;

      setUpvoted(next);
      setCount(c => (next ? c + 1 : Math.max(0, c - 1)));

      await upvoteAPI.toggle(report.id);
    } catch {
      // rollback
      setUpvoted(prev => !prev);
      setCount(c => (upvoted ? c + 1 : Math.max(0, c - 1)));

      toast.error('Login required to upvote.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="cs-card p-4 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-200"
    >
      {/* Image */}
      {report.image_url ? (
        <div className="rounded-xl overflow-hidden h-36 bg-bg-elevated">
          <img
            src={`http://localhost:5000${report.image_url}`}
            alt="report"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-xl h-36 bg-bg-elevated border border-border flex items-center justify-center">
          <MapPin size={28} className="text-gray-600" />
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={sev} size="sm" />
        <span className="text-xs font-mono text-gray-600">#{report.id}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 line-clamp-2 flex-1">
        {report.description || 'No description provided.'}
      </p>

      {/* Category & date */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span className="capitalize font-medium text-gray-400">{report.category}</span>
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Upvote + Priority */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={handleUpvote}
          disabled={upvoted === null}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${upvoted
            ? 'bg-amber/10 border-amber/30 text-amber'
            : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
            }`}
        >
          <ThumbsUp size={12} className={upvoted ? 'fill-amber' : ''} />
          {count} Upvote{count !== 1 ? 's' : ''}
        </button>
        <PriorityRing score={report.priority_score} size={40} />
      </div>
    </motion.div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.getAll()
      .then(res => setReports(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  // Derived stats from real reports
  const totalIssues = reports.length;
  const openIssues = reports.filter(r => !r.status || r.status === 'open').length;
  const criticalCount = reports.filter(r => r.severity_score >= 80).length;
  const avgPriority = totalIssues
    ? Math.round(reports.reduce((s, r) => s + r.priority_score, 0) / totalIssues)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-10 h-10 border-2 mx-auto mb-4" />
          <p className="text-gray-500 font-display uppercase tracking-widest text-sm">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-gray-500 text-sm mb-1">{greeting()},</p>
            <h1 className="font-display text-4xl font-black text-white">
              {/* Everyone sees their own name in the greeting */}
              {(user?.name ?? 'CITIZEN').toUpperCase()} <span className="text-amber">👋</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn-secondary px-5 py-3 rounded-xl flex items-center gap-2 text-sm">
                <Activity size={16} /> Admin Panel
              </Link>
            )}
            <Link to="/report" className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
              <Plus size={18} /> Report Issue
            </Link>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Reports" value={totalIssues} icon={AlertTriangle}
            accent="amber" gradient="bg-amber-500"
          />
          <StatCard
            label="Open Issues" value={openIssues} icon={Clock}
            accent="red" delta="Live" deltaUp={false}
          />
          <StatCard
            label="Critical" value={criticalCount} icon={Zap}
            accent="red"
          />
          <StatCard
            label="Avg Priority Score" value={avgPriority} icon={TrendingUp}
            accent="cyan" suffix="/100"
          />
        </div>

        {/* ── Charts Row ── */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* Activity chart */}
          <div className="lg:col-span-2 cs-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Weekly Activity</h3>
                <p className="text-xs text-gray-500">Reports vs Resolutions — Last 7 days</p>
              </div>
              <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                +18% resolved
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="reported" name="Reported" stroke="#F97316" strokeWidth={2} fill="url(#gradReported)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#06B6D4" strokeWidth={2} fill="url(#gradResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Severity breakdown */}
          <div className="cs-card p-5">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-1">By Severity</h3>
            <p className="text-xs text-gray-500 mb-4">Open issues breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={SEVERITY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" stroke="none">
                  {SEVERITY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {SEVERITY_DATA.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs text-gray-400">{s.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Priority Bar Chart ── */}
        {reports.length > 0 && (
          <div className="cs-card p-5 mb-8">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-1">Priority Scores</h3>
            <p className="text-xs text-gray-500 mb-4">Top reports by priority</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={reports.slice(0, 8).map(r => ({
                  name: `#${r.id}`,
                  priority: r.priority_score,
                  severity: r.severity_score,
                }))}
                margin={{ top: 5, right: 10, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="priority" name="Priority" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="severity" name="Severity" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Recent Reports ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Recent Reports</h2>
              <p className="text-xs text-gray-500">Latest from the community — upvote to prioritise</p>
            </div>
            <Link to="/issues" className="btn-secondary px-4 py-2 rounded-lg text-xs flex items-center gap-1.5">
              <Filter size={13} /> All Issues
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="cs-card p-12 text-center">
              <AlertTriangle size={40} className="text-gray-600 mx-auto mb-4" />
              <p className="font-display text-lg font-bold text-gray-500 uppercase tracking-wide">No reports yet</p>
              <p className="text-sm text-gray-600 mt-1 mb-6">Be the first to report a civic issue.</p>
              <Link to="/report" className="btn-primary px-6 py-3 rounded-xl inline-flex items-center gap-2">
                <Plus size={16} /> Report an Issue
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reports.map((report, i) => (
                <ReportCard key={report.id} report={report} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* ── Quick link for admin ── */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-8 cs-card p-5 border-amber/20 bg-amber/5 flex items-center justify-between"
          >
            <div>
              <p className="font-display font-bold text-white">Admin Dashboard</p>
              <p className="text-xs text-gray-400">Manage reports, users, and send feedback to citizens.</p>
            </div>
            <Link to="/admin" className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <Activity size={15} /> Open <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
