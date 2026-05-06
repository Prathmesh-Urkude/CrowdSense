import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, MapPin, Clock, ChevronRight, AlertTriangle,
  ThumbsUp, Trash2, Plus, Filter, BarChart2, CheckCircle2,
  XCircle, Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { reportsAPI } from '../utils/api';
import { SeverityBadge, StatusBadge, PriorityRing } from '../components/SeverityBadge';
import type { BackendReport, IssueStatus, SeverityLevel } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const IMG_BASE = 'http://localhost:5000';

const resolveImgUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;           // already absolute
  if (url.startsWith('/')) return `${IMG_BASE}${url}`;
  return `${IMG_BASE}/${url}`;                      // missing leading slash
};

const scaleSev = (s: number) =>
  s > 15 ? Math.min(Math.round(s), 100) : Math.min(Math.round((s / 15) * 100), 100);

const scalePri = (p: number) =>
  p <= 1   ? Math.min(Math.round(p * 100), 100)
  : p <= 15 ? Math.min(Math.round((p / 15) * 100), 100)
  : Math.min(Math.round(p), 100);

const severityFromScore = (s: number): SeverityLevel =>
  s >= 80 ? 'critical' : s >= 60 ? 'high' : s >= 40 ? 'medium' : 'low';

const STATUS_VALUES: IssueStatus[] = [
  'pending','reported','under-review','assigned','open','in_progress','resolved','closed','rejected',
];
const toStatus = (s?: string): IssueStatus =>
  (STATUS_VALUES.includes(s as IssueStatus) ? s : 'reported') as IssueStatus;

const isActive = (s?: string) =>
  ['reported','pending','open','under-review','assigned','in_progress'].includes(s ?? '');

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: number; icon: React.ReactNode; color: string;
}> = ({ label, value, icon, color }) => (
  <div className="cs-card p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="font-display text-xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 cs-card p-6 max-w-sm w-full"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <h3 className="font-display text-base font-bold text-white">Delete Report?</h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        This action cannot be undone. The report and all associated data will be permanently removed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border bg-bg-elevated text-gray-400 hover:text-white transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition font-semibold disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Report Card ─────────────────────────────────────────────────────────────
const ReportCard: React.FC<{
  report: BackendReport;
  index: number;
  onDelete: (id: string) => void;
}> = ({ report, index, onDelete }) => {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sev = severityFromScore(scaleSev(report.severity_score));
  const pri = scalePri(report.priority_score);
  const rawSev = report.severity_score > 15
    ? (report.severity_score / 100) * 15
    : report.severity_score;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await reportsAPI.delete(report.id);
      toast.success('Report deleted.');
      onDelete(report.id);
    } catch {
      toast.error('Failed to delete report.');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="cs-card overflow-hidden group hover:border-amber/30 transition-all duration-300 flex flex-col"
      >
        {/* Image */}
        <div
          className="relative cursor-pointer"
          onClick={() => navigate(`/issues/${report.id}`)}
        >
          {resolveImgUrl(report.image_url) ? (
            <img
              src={resolveImgUrl(report.image_url)!}
              alt="report"
              className="w-full h-48 object-cover"
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
              }}
            />
          ) : null}
          <div
            className="w-full h-48 bg-bg-elevated items-center justify-center"
            style={{ display: resolveImgUrl(report.image_url) ? 'none' : 'flex' }}
          >
            <FileText size={40} className="text-gray-600" />
          </div>

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <SeverityBadge severity={sev} size="sm" />
          </div>
          <div className="absolute top-3 right-3">
            <StatusBadge status={toStatus(report.status)} size="sm" />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display uppercase tracking-widest text-amber mb-1">
                {report.category?.replace(/_/g, ' ') || 'Road Damage'}
              </p>
              <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                {report.description || 'No description provided'}
              </p>
            </div>
            <PriorityRing score={pri} size={48} />
          </div>

          {/* Score row */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex-1 bg-bg-elevated rounded-lg px-3 py-1.5">
              <span className="text-gray-500">Severity </span>
              <span className="font-mono font-bold text-white">{rawSev.toFixed(1)}/15</span>
            </div>
            <div className="flex-1 bg-bg-elevated rounded-lg px-3 py-1.5">
              <span className="text-gray-500">Priority </span>
              <span className="font-mono font-bold text-white">{pri}/100</span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {report.lat != null && report.lng != null && (
              <span className="flex items-center gap-1">
                <MapPin size={11} className="text-amber" />
                {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </span>
            {report.upvote_count != null && (
              <span className="flex items-center gap-1 ml-auto">
                <ThumbsUp size={11} />
                {report.upvote_count}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-border mt-auto">
            <Link
              to={`/issues/${report.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-amber hover:bg-amber/10 border border-amber/20 transition"
            >
              View Details <ChevronRight size={13} />
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </motion.div>

      {showDelete && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </>
  );
};

// ─── Filter Tab ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'rejected', label: 'Rejected' },
] as const;
type FilterKey = typeof FILTERS[number]['key'];

// ─── MyReports ────────────────────────────────────────────────────────────────
const MyReports: React.FC = () => {
  const [reports, setReports]   = useState<BackendReport[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<FilterKey>('all');

  useEffect(() => {
    reportsAPI.getUserReports()
      .then(res => setReports(res.data as BackendReport[]))
      .catch(err => setError(err?.response?.data?.error ?? 'Failed to load your reports.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) =>
    setReports(prev => prev.filter(r => r.id !== id));

  const filtered = useMemo(() => {
    if (filter === 'all')      return reports;
    if (filter === 'active')   return reports.filter(r => isActive(r.status));
    if (filter === 'resolved') return reports.filter(r => r.status === 'resolved' || r.status === 'closed');
    if (filter === 'rejected') return reports.filter(r => r.status === 'rejected');
    return reports;
  }, [reports, filter]);

  // Stats
  const stats = useMemo(() => ({
    total:    reports.length,
    active:   reports.filter(r => isActive(r.status)).length,
    resolved: reports.filter(r => r.status === 'resolved' || r.status === 'closed').length,
    critical: reports.filter(r => severityFromScore(scaleSev(r.severity_score)) === 'critical').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  }), [reports]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-10 h-10 border-2 mx-auto mb-4" />
        <p className="text-gray-500 font-display uppercase tracking-widest text-xs">Loading reports…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="cs-card p-8 text-center max-w-sm">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-300 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-grid noise pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber/20 border border-amber/30 flex items-center justify-center">
              <FileText size={18} className="text-amber" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-wide">
                My Reports
              </h1>
              <p className="text-gray-500 text-xs">
                {reports.length} report{reports.length !== 1 ? 's' : ''} submitted by you
              </p>
            </div>
          </div>
          <Link
            to="/report"
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          >
            <Plus size={15} /> New Report
          </Link>
        </motion.div>

        {/* ── Stats row ── */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          >
            <StatCard
              label="Total"
              value={stats.total}
              icon={<BarChart2 size={18} className="text-amber" />}
              color="bg-amber/10 border border-amber/20"
            />
            <StatCard
              label="Active"
              value={stats.active}
              icon={<Activity size={18} className="text-blue-400" />}
              color="bg-blue-500/10 border border-blue-500/20"
            />
            <StatCard
              label="Resolved"
              value={stats.resolved}
              icon={<CheckCircle2 size={18} className="text-green-400" />}
              color="bg-green-500/10 border border-green-500/20"
            />
            <StatCard
              label="Critical"
              value={stats.critical}
              icon={<XCircle size={18} className="text-red-400" />}
              color="bg-red-500/10 border border-red-500/20"
            />
          </motion.div>
        )}

        {/* ── Filter tabs ── */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-1 mb-6 bg-bg-card border border-border rounded-xl p-1 w-fit"
          >
            <Filter size={13} className="text-gray-500 ml-2 mr-1" />
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-display uppercase tracking-widest transition-all ${
                  filter === f.key
                    ? 'bg-amber text-bg-card font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span className={`ml-1.5 text-[10px] ${filter === f.key ? 'text-bg-card/70' : 'text-gray-600'}`}>
                    {f.key === 'active'   ? stats.active
                    : f.key === 'resolved' ? stats.resolved
                    : stats.rejected}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Empty state ── */}
        {reports.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="cs-card p-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-5">
              <FileText size={32} className="text-amber" />
            </div>
            <h2 className="font-display text-lg font-bold text-gray-200 mb-2 uppercase tracking-wide">
              No reports yet
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              You haven't submitted any reports. Help improve your city by reporting road damage.
            </p>
            <Link
              to="/report"
              className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
            >
              <Plus size={15} /> Report an Issue
            </Link>
          </motion.div>
        )}

        {/* ── Filtered empty ── */}
        {reports.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="cs-card p-12 text-center"
          >
            <p className="text-gray-500 text-sm">No reports match this filter.</p>
          </motion.div>
        )}

        {/* ── Report grid ── */}
        <AnimatePresence mode="popLayout">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((report, i) => (
              <ReportCard
                key={report.id}
                report={report}
                index={i}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>

      </div>
    </div>
  );
};

export default MyReports;
