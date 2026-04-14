import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, Users, Download,
  ChevronDown, Search, MoreVertical, Zap, TrendingUp,
  RefreshCw, Shield
} from 'lucide-react';
import { SeverityBadge, StatusBadge, PriorityRing } from '../components/SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import type { Issue, IssueStatus } from '../types';

const MOCK_ISSUES: Issue[] = [
  { id: 'i001', title: 'Large pothole on MG Road', description: '', category: 'pothole', status: 'open', severity: 'critical', priorityScore: 92, location: { address: 'MG Road, Bus Stop 14', ward: 'Ward 14', city: 'Pune', coordinates: { lat: 18.52, lng: 73.86 } }, images: [], aiAnalysis: { severity: 'critical', severityScore: 89, priorityScore: 92, confidence: 0.94, damageType: 'Pothole', estimatedArea: 2.4, repairEstimate: '₹18,000–₹25,000', urgencyReason: 'High traffic', detectedFeatures: [], boundingBoxes: [] }, reportedBy: { id: 'u1', name: 'Amit S.' }, upvotes: 47, comments: [], createdAt: new Date(Date.now() - 2*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i002', title: 'Road crack — FC Road', description: '', category: 'crack', status: 'in_progress', severity: 'high', priorityScore: 74, location: { address: 'FC Road, Shivajinagar', ward: 'Ward 7', city: 'Pune', coordinates: { lat: 18.53, lng: 73.85 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 72, priorityScore: 74, confidence: 0.88, damageType: 'Crack', estimatedArea: 5.1, repairEstimate: '₹8,000–₹12,000', urgencyReason: 'Spreading', detectedFeatures: [], boundingBoxes: [] }, reportedBy: { id: 'u2', name: 'Priya P.' }, upvotes: 23, comments: [], createdAt: new Date(Date.now() - 8*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i003', title: 'Waterlogging Baner Road', description: '', category: 'waterlogging', status: 'open', severity: 'medium', priorityScore: 58, location: { address: 'Baner Road, Balewadi', ward: 'Ward 3', city: 'Pune', coordinates: { lat: 18.56, lng: 73.79 } }, images: [], aiAnalysis: { severity: 'medium', severityScore: 55, priorityScore: 58, confidence: 0.82, damageType: 'Waterlogging', estimatedArea: 15, repairEstimate: '₹30,000–₹50,000', urgencyReason: 'Drainage', detectedFeatures: [], boundingBoxes: [] }, reportedBy: { id: 'u3', name: 'Rahul D.' }, upvotes: 12, comments: [], createdAt: new Date(Date.now() - 24*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i004', title: 'Footpath damage Deccan', description: '', category: 'damaged_footpath', status: 'resolved', severity: 'low', priorityScore: 35, location: { address: 'Deccan Gymkhana', ward: 'Ward 11', city: 'Pune', coordinates: { lat: 18.52, lng: 73.84 } }, images: [], aiAnalysis: { severity: 'low', severityScore: 30, priorityScore: 35, confidence: 0.91, damageType: 'Footpath', estimatedArea: 3.2, repairEstimate: '₹5,000–₹8,000', urgencyReason: 'Pedestrian', detectedFeatures: [], boundingBoxes: [] }, reportedBy: { id: 'u4', name: 'Sneha K.' }, upvotes: 8, comments: [], createdAt: new Date(Date.now() - 48*3600000).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: new Date().toISOString() },
  { id: 'i005', title: 'Broken divider Highway', description: '', category: 'broken_divider', status: 'open', severity: 'high', priorityScore: 81, location: { address: 'Pune-Mumbai Hwy', ward: 'Ward 2', city: 'Pune', coordinates: { lat: 18.63, lng: 73.8 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 78, priorityScore: 81, confidence: 0.9, damageType: 'Divider', estimatedArea: 8, repairEstimate: '₹20,000–₹35,000', urgencyReason: 'Highway safety', detectedFeatures: [], boundingBoxes: [] }, reportedBy: { id: 'u5', name: 'Vikram M.' }, upvotes: 31, comments: [], createdAt: new Date(Date.now() - 3*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i006', title: 'Pothole cluster Kothrud', description: '', category: 'pothole', status: 'open', severity: 'critical', priorityScore: 88, location: { address: 'Kothrud Market Road', ward: 'Ward 9', city: 'Pune', coordinates: { lat: 18.51, lng: 73.81 } }, images: [], aiAnalysis: { severity: 'critical', severityScore: 85, priorityScore: 88, confidence: 0.96, damageType: 'Multiple Potholes', estimatedArea: 7.5, repairEstimate: '₹40,000–₹60,000', urgencyReason: 'Multiple high risk', detectedFeatures: [], boundingBoxes: [] }, reportedBy: { id: 'u6', name: 'Anita R.' }, upvotes: 55, comments: [], createdAt: new Date(Date.now() - 5*3600000).toISOString(), updatedAt: new Date().toISOString() },
];

const RESOLUTION_DATA = [
  { month: 'Oct', issues: 89, resolved: 72 },
  { month: 'Nov', issues: 112, resolved: 94 },
  { month: 'Dec', issues: 78, resolved: 70 },
  { month: 'Jan', issues: 134, resolved: 98 },
  { month: 'Feb', issues: 156, resolved: 127 },
  { month: 'Mar', issues: 203, resolved: 168 },
];

const SLA_DATA = [
  { ward: 'Ward 14', sla: 92 },
  { ward: 'Ward 7',  sla: 78 },
  { ward: 'Ward 3',  sla: 65 },
  { ward: 'Ward 11', sla: 88 },
  { ward: 'Ward 2',  sla: 55 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2.5 rounded-xl border border-border text-xs space-y-1">
      <p className="font-display font-bold text-white uppercase tracking-wider">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [issues, setIssues] = useState(MOCK_ISSUES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const updateStatus = (id: string, status: IssueStatus) => {
    setIssues(p => p.map(i => i.id === id ? { ...i, status } : i));
    setOpenMenu(null);
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
  };

  const filtered = issues
    .filter(i => !statusFilter || i.status === statusFilter)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.location.ward.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const stats = {
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.severity === 'critical' && i.status === 'open').length,
  };

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-amber/10 border border-amber/20 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-amber" />
              </div>
              <h1 className="font-display text-4xl font-black text-white uppercase tracking-wide">Admin Panel</h1>
            </div>
            <p className="text-gray-400 text-sm">Manage and action all city infrastructure issues</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.success('Report exported!')}
              className="flex items-center gap-2 btn-secondary px-4 py-2.5 rounded-xl text-sm"
            >
              <Download size={15} /> Export Report
            </button>
            <button
              onClick={() => toast.success('Data refreshed!')}
              className="flex items-center gap-2 btn-secondary px-4 py-2.5 rounded-xl text-sm"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Open Issues',      val: stats.open,       icon: AlertTriangle, accent: 'text-amber',       bg: 'bg-amber/10 border-amber/20' },
            { label: 'In Progress',      val: stats.inProgress, icon: Clock,         accent: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
            { label: 'Resolved',         val: stats.resolved,   icon: CheckCircle2,  accent: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Critical Pending', val: stats.critical,   icon: Zap,           accent: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="cs-card p-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${s.bg}`}>
                <s.icon size={18} className={s.accent} />
              </div>
              <div className="font-display text-3xl font-black text-white">{s.val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-5 mb-8">
          <div className="cs-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide">Monthly Trends</h3>
                <p className="text-xs text-gray-500">Issues reported vs resolved</p>
              </div>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={RESOLUTION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="issues" name="Reported" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316', r: 3 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="cs-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide">SLA Compliance</h3>
                <p className="text-xs text-gray-500">% issues resolved within SLA per ward</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SLA_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="ward" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sla" name="SLA %" fill="#06B6D4" radius={[4, 4, 0, 0]}
                  background={{ fill: '#1A2235', radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Management Table */}
        <div className="cs-card overflow-hidden">
          <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Issue Management</h3>

            {/* Search */}
            <div className="relative ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search issues..."
                className="cs-input pl-8 pr-4 py-2 rounded-lg text-sm w-52"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value as IssueStatus | '')}
                className="cs-input pr-8 pl-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Issue', 'Severity', 'Status', 'Priority', 'Location', 'Reported', 'Action'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-display uppercase tracking-widest text-gray-500">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue, i) => (
                  <motion.tr
                    key={issue.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border hover:bg-white/3 transition group"
                  >
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="text-sm font-semibold text-white truncate">{issue.title}</p>
                      <p className="text-xs text-gray-500 font-mono">#{issue.id.slice(-6)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <SeverityBadge severity={issue.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={issue.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityRing score={issue.priorityScore} size={44} />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-gray-300">{issue.location.ward}</p>
                      <p className="text-xs text-gray-500">{issue.location.city}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</p>
                      <p className="text-xs text-gray-600">by {issue.reportedBy.name}</p>
                    </td>
                    <td className="px-4 py-3.5 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === issue.id ? null : issue.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {openMenu === issue.id && (
                        <div className="absolute right-12 top-0 z-20 w-44 glass rounded-xl border border-border shadow-elevated overflow-hidden">
                          {([
                            { label: 'Mark Open', status: 'open' },
                            { label: 'Mark In Progress', status: 'in_progress' },
                            { label: 'Mark Resolved', status: 'resolved' },
                            { label: 'Mark Closed', status: 'closed' },
                          ] as const).map(opt => (
                            <button
                              key={opt.status}
                              onClick={() => updateStatus(issue.id, opt.status)}
                              className={clsx(
                                'w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition',
                                issue.status === opt.status ? 'text-amber' : 'text-gray-300'
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                          <div className="border-t border-border">
                            <button
                              onClick={() => { toast.success(`Assigned ${issue.id}`); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2.5 text-xs text-cyan-400 hover:bg-white/5 transition flex items-center gap-2"
                            >
                              <Users size={11} /> Assign Official
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-gray-500 font-display uppercase tracking-widest text-sm">No issues match filters</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filtered.length} of {issues.length} issues</span>
            <span className="font-mono">{new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
