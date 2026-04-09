import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, Users, Plus,
  MapPin, ArrowRight, TrendingUp, Zap, Filter
} from 'lucide-react';
import StatCard from '../components/StatCard';
import IssueCard from '../components/IssueCard';
import { SeverityBadge, StatusBadge, PriorityRing } from '../components/SeverityBadge';
import { useAuth } from '../context/AuthContext';
import type { Issue, DashboardStats } from '../types';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_STATS: DashboardStats = {
  totalIssues: 1284, openIssues: 347, resolvedThisMonth: 203,
  criticalPending: 18, avgResolutionDays: 4.2, citizensEngaged: 892,
};

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
  { name: 'High',     value: 67, color: '#F97316' },
  { name: 'Medium',   value: 142, color: '#F59E0B' },
  { name: 'Low',      value: 120, color: '#22C55E' },
];

const WARD_DATA = [
  { ward: 'Ward 14', issues: 78 },
  { ward: 'Ward 7',  issues: 65 },
  { ward: 'Ward 3',  issues: 54 },
  { ward: 'Ward 11', issues: 48 },
  { ward: 'Ward 2',  issues: 42 },
  { ward: 'Ward 9',  issues: 38 },
];

const MOCK_ISSUES: Issue[] = [
  {
    id: 'iss_001abc',
    title: 'Large pothole near bus stop — MG Road',
    description: 'Deep pothole causing vehicle damage. Multiple reports from commuters.',
    category: 'pothole', status: 'open', severity: 'critical', priorityScore: 92,
    location: { address: 'MG Road, near Bus Stop 14', ward: 'Ward 14', city: 'Pune', coordinates: { lat: 18.5204, lng: 73.8567 } },
    images: [], aiAnalysis: { severity: 'critical', severityScore: 89, priorityScore: 92, confidence: 0.94, damageType: 'Pothole', estimatedArea: 2.4, repairEstimate: '₹18,000 - ₹25,000', urgencyReason: 'High traffic zone', detectedFeatures: ['Deep pothole', 'Edge cracking'], boundingBoxes: [] },
    reportedBy: { id: 'u1', name: 'Amit Sharma' }, upvotes: 47, comments: [], createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'iss_002def',
    title: 'Road crack spreading — FC Road',
    description: 'Long crack developing across the main road width. Needs urgent attention.',
    category: 'crack', status: 'in_progress', severity: 'high', priorityScore: 74,
    location: { address: 'FC Road, Shivajinagar', ward: 'Ward 7', city: 'Pune', coordinates: { lat: 18.5300, lng: 73.8453 } },
    images: [], aiAnalysis: { severity: 'high', severityScore: 72, priorityScore: 74, confidence: 0.88, damageType: 'Linear Crack', estimatedArea: 5.1, repairEstimate: '₹8,000 - ₹12,000', urgencyReason: 'Spreading pattern', detectedFeatures: ['Alligator cracking', 'Surface deformation'], boundingBoxes: [] },
    reportedBy: { id: 'u2', name: 'Priya Patil' }, upvotes: 23, comments: [], createdAt: new Date(Date.now() - 8 * 3600000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'iss_003ghi',
    title: 'Waterlogging on Baner Road',
    description: 'Severe waterlogging during rain. Road becomes unusable.',
    category: 'waterlogging', status: 'open', severity: 'medium', priorityScore: 58,
    location: { address: 'Baner Road, near Balewadi', ward: 'Ward 3', city: 'Pune', coordinates: { lat: 18.5590, lng: 73.7868 } },
    images: [], aiAnalysis: { severity: 'medium', severityScore: 55, priorityScore: 58, confidence: 0.82, damageType: 'Waterlogging', estimatedArea: 15.0, repairEstimate: '₹30,000 - ₹50,000', urgencyReason: 'Drainage failure', detectedFeatures: ['Standing water', 'Drainage blockage'], boundingBoxes: [] },
    reportedBy: { id: 'u3', name: 'Rahul Deshmukh' }, upvotes: 12, comments: [], createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'iss_004jkl',
    title: 'Damaged footpath — Deccan Gymkhana',
    description: 'Footpath tiles broken and uplifted. Hazard for pedestrians.',
    category: 'damaged_footpath', status: 'resolved', severity: 'low', priorityScore: 35,
    location: { address: 'Deccan Gymkhana, Pune', ward: 'Ward 11', city: 'Pune', coordinates: { lat: 18.5167, lng: 73.8369 } },
    images: [], aiAnalysis: { severity: 'low', severityScore: 30, priorityScore: 35, confidence: 0.91, damageType: 'Footpath Damage', estimatedArea: 3.2, repairEstimate: '₹5,000 - ₹8,000', urgencyReason: 'Pedestrian safety', detectedFeatures: ['Lifted tiles', 'Uneven surface'], boundingBoxes: [] },
    reportedBy: { id: 'u4', name: 'Sneha Kulkarni' }, upvotes: 8, comments: [], createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: new Date().toISOString(),
  },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats] = useState<DashboardStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-gray-500 text-sm mb-1">{greeting()},</p>
            <h1 className="font-display text-4xl font-black text-white">
              {user?.name?.toUpperCase() || 'CITIZEN'} <span className="text-amber">👋</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {user?.ward} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link to="/report" className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} /> Report New Issue
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="xl:col-span-1 col-span-1">
            <StatCard label="Total Issues"      value={stats.totalIssues}        icon={AlertTriangle} accent="amber" />
          </div>
          <div className="xl:col-span-1 col-span-1">
            <StatCard label="Open Issues"       value={stats.openIssues}         icon={Clock}        accent="red" delta="12%" deltaUp={false} />
          </div>
          <div className="xl:col-span-1 col-span-1">
            <StatCard label="Resolved (Month)"  value={stats.resolvedThisMonth}  icon={CheckCircle2} accent="green" delta="18%" deltaUp={true} />
          </div>
          <div className="xl:col-span-1 col-span-1">
            <StatCard label="Critical Pending"  value={stats.criticalPending}    icon={Zap}          accent="red" />
          </div>
          <div className="xl:col-span-1 col-span-1">
            <StatCard label="Avg Fix (days)"    value={stats.avgResolutionDays}  icon={TrendingUp}   accent="cyan" suffix=" d" />
          </div>
          <div className="xl:col-span-1 col-span-1">
            <StatCard label="Citizens Active"   value={stats.citizensEngaged}    icon={Users}        accent="purple" delta="8%" deltaUp={true} />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 cs-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Weekly Activity</h3>
                <p className="text-xs text-gray-500">Reports vs Resolutions — Last 7 days</p>
              </div>
              <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">+18% resolved</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Manrope' }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Manrope' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="reported" name="Reported" stroke="#F97316" strokeWidth={2} fill="url(#gradReported)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#06B6D4" strokeWidth={2} fill="url(#gradResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Pie */}
          <div className="cs-card p-5">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-1">By Severity</h3>
            <p className="text-xs text-gray-500 mb-4">Open issues breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={SEVERITY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" stroke="none">
                  {SEVERITY_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
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

        {/* Ward Heatbar + Priority Queue */}
        <div className="grid lg:grid-cols-2 gap-5 mb-8">
          {/* Ward Issues */}
          <div className="cs-card p-5">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-1">Top Affected Wards</h3>
            <p className="text-xs text-gray-500 mb-5">Open issues per ward</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WARD_DATA} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis type="category" dataKey="ward" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={52} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issues" name="Issues" fill="#F97316" radius={[0, 4, 4, 0]}
                  background={{ fill: '#1A2235', radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Queue */}
          <div className="cs-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Priority Queue</h3>
                <p className="text-xs text-gray-500">Highest severity open issues</p>
              </div>
              <Link to="/issues?sortBy=priorityScore" className="text-xs text-amber hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_ISSUES.filter(i => i.status !== 'resolved').sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4).map((issue, idx) => (
                <Link key={issue.id} to={`/issues/${issue.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-white/5 transition group">
                    <div className="font-display text-2xl font-black text-gray-600 w-6 text-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate leading-tight">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SeverityBadge severity={issue.severity} size="sm" />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={9} />{issue.location.ward}
                        </span>
                      </div>
                    </div>
                    <PriorityRing score={issue.priorityScore} size={44} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Recent Reports</h2>
              <p className="text-xs text-gray-500">Latest issues in your area</p>
            </div>
            <div className="flex gap-2">
              <Link to="/issues" className="btn-secondary px-4 py-2 rounded-lg text-xs flex items-center gap-1.5">
                <Filter size={13} /> All Issues
              </Link>
              <Link to="/report" className="btn-primary px-4 py-2 rounded-lg text-xs flex items-center gap-1.5">
                <Plus size={13} /> Report
              </Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_ISSUES.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} view="grid" index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
