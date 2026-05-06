import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Calendar, FileText,
  ThumbsUp, CheckCircle2, AlertTriangle,
  LogOut, ChevronRight, Activity, MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../utils/api';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import type { BackendReport, SeverityLevel } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const scaleSev = (s: number) =>
  s > 15 ? Math.min(Math.round(s), 100) : Math.min(Math.round((s / 15) * 100), 100);
const severityFromScore = (s: number): SeverityLevel =>
  s >= 80 ? 'critical' : s >= 60 ? 'high' : s >= 40 ? 'medium' : 'low';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  user: 'Citizen',
  citizen: 'Citizen',
  official: 'Official',
};

// ─── Stat Tile ────────────────────────────────────────────────────────────────
const Tile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="cs-card p-4 flex flex-col gap-2">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <p className="font-display text-2xl font-black text-white">{value}</p>
    <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
  </div>
);

// ─── ProfilePage ──────────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.getUserReports()
      .then(res => setReports(res.data as BackendReport[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const total    = reports.length;
  const resolved = reports.filter(r => r.status === 'resolved' || r.status === 'closed').length;
  const active   = reports.filter(r =>
    ['reported','pending','open','under-review','assigned','in_progress'].includes(r.status ?? '')
  ).length;
  const totalUpvotes = reports.reduce((sum, r) => sum + (r.upvote_count ?? 0), 0);

  const recent = reports.slice(0, 3);

  return (
    <div className="min-h-screen bg-grid noise pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="cs-card p-6 mb-5"
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-amber/20 border-2 border-amber/40 flex items-center justify-center">
                <span className="font-display text-3xl font-black text-amber">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-bg-card" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="font-display text-2xl font-black text-white">{user?.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-display uppercase tracking-widest bg-amber/10 text-amber border border-amber/20">
                      <Shield size={10} />
                      {ROLE_LABELS[user?.role ?? 'user']}
                    </span>
                    {user?.createdAt && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={11} />
                        Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition"
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>

              {/* Contact */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail size={14} className="text-gray-600" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User size={14} className="text-gray-600" />
                  @{user?.username ?? user?.name?.toLowerCase().replace(/\s+/g, '_')}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        >
          <Tile
            icon={<FileText size={16} className="text-amber" />}
            label="Reports Filed"
            value={loading ? '—' : total}
            color="bg-amber/10 border border-amber/20"
          />
          <Tile
            icon={<Activity size={16} className="text-blue-400" />}
            label="Active"
            value={loading ? '—' : active}
            color="bg-blue-500/10 border border-blue-500/20"
          />
          <Tile
            icon={<CheckCircle2 size={16} className="text-green-400" />}
            label="Resolved"
            value={loading ? '—' : resolved}
            color="bg-green-500/10 border border-green-500/20"
          />
          <Tile
            icon={<ThumbsUp size={16} className="text-purple-400" />}
            label="Upvotes Received"
            value={loading ? '—' : totalUpvotes}
            color="bg-purple-500/10 border border-purple-500/20"
          />
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">

          {/* ── Recent Reports ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sm:col-span-2 cs-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">
                Recent Reports
              </h2>
              <Link
                to="/my-reports"
                className="text-xs text-amber hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-bg-elevated rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={32} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No reports yet.</p>
                <Link
                  to="/report"
                  className="inline-block mt-3 btn-primary px-4 py-2 rounded-xl text-xs"
                >
                  File First Report
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map(r => (
                  <Link
                    key={r.id}
                    to={`/issues/${r.id}`}
                    className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl hover:bg-white/5 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {r.description || r.category?.replace(/_/g, ' ') || 'Report'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <SeverityBadge severity={severityFromScore(scaleSev(r.severity_score))} size="sm" />
                        <StatusBadge status={(r.status as any) ?? 'reported'} size="sm" />
                        <span className="text-xs text-gray-600">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-amber transition flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Quick Links ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <div className="cs-card p-5">
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide mb-3">
                Quick Links
              </h2>
              <div className="space-y-1">
                {[
                  { icon: Activity,      label: 'Dashboard',   href: '/dashboard',   color: 'text-blue-400' },
                  { icon: FileText,      label: 'My Reports',  href: '/my-reports',  color: 'text-amber'    },
                  { icon: AlertTriangle, label: 'Report Issue', href: '/report',      color: 'text-red-400'  },
                  { icon: MapPin,        label: 'Browse Issues', href: '/issues',     color: 'text-green-400'},
                ].map(item => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition group"
                  >
                    <item.icon size={15} className={item.color} />
                    {item.label}
                    <ChevronRight size={13} className="ml-auto text-gray-600 group-hover:text-white transition" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="cs-card p-4">
              <h2 className="font-display text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Account Info
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="text-white font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-mono text-gray-400">#{user?.id?.slice(-8)}</span>
                </div>
                {user?.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member since</span>
                    <span className="text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
