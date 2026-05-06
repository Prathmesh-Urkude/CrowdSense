import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, Users, Download,
  ChevronDown, Search, Zap, TrendingUp,
  RefreshCw, Shield, Plus, Trash2,
  UserCheck, X, Send, Eye, ExternalLink, List,
  MapPin, ThumbsUp, Brain, ChevronRight,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { SeverityBadge, StatusBadge, PriorityRing, SeverityBar } from '../components/SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI, disputeAPI } from '../utils/api';
import type { BackendReport, IssueStatus, SeverityLevel } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MockUser {
  id: string; username: string; email: string;
  role: 'user' | 'admin'; createdAt: string;
}
type TabId = 'reports' | 'users' | 'create';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMG_BASE = 'http://localhost:5000';

const scaleSev = (s: number) =>
  s > 15 ? Math.min(Math.round(s), 100) : Math.min(Math.round((s / 15) * 100), 100);
const scalePri = (p: number) =>
  p <= 1 ? Math.min(Math.round(p * 100), 100)
  : p <= 15 ? Math.min(Math.round((p / 15) * 100), 100)
  : Math.min(Math.round(p), 100);
const severityLabel = (score: number): SeverityLevel =>
  score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

const resolveImg = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${IMG_BASE}${url.startsWith('/') ? url : `/${url}`}`;
};

const STATUS_OPTIONS: IssueStatus[] = [
  'reported', 'under-review', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected',
];

// ─── Report Detail Panel ──────────────────────────────────────────────────────
const ReportDetailPanel: React.FC<{
  report: BackendReport;
  onClose: () => void;
  onUpdated: (updated: BackendReport) => void;
}> = ({ report, onClose, onUpdated }) => {
  const [status, setStatus]   = useState<string>(report.status ?? 'reported');
  const [remark, setRemark]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [disputes, setDisputes] = useState<any[]>([]);

  const rawSev = report.severity_score > 15
    ? (report.severity_score / 100) * 15
    : report.severity_score;
  const displaySev = scaleSev(report.severity_score);
  const displayPri = scalePri(report.priority_score);
  const sev = severityLabel(displaySev);

  useEffect(() => {
    disputeAPI.getForReport(report.id)
      .then(res => setDisputes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDisputes([]))
  }, [report.id]);

  const handleSave = async () => {
    if (status === 'resolved' && !remark.trim()) {
      toast.error('A remark is required when resolving a report. It will be emailed to the reporter.');
      return;
    }
    setSaving(true);
    try {
      const res = await adminAPI.updateReportStatus(report.id, status, remark.trim() || undefined);
      const updated = (res.data as any)?.report ?? { ...report, status };
      toast.success(`Status updated to "${status.replace(/_/g, ' ')}"${status === 'resolved' ? ' — email sent to reporter' : ''}`);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const imgSrc = resolveImg(report.image_url);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative ml-auto w-full max-w-xl h-full bg-bg-card border-l border-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs font-mono text-gray-500">#{report.id.slice(-10)}</p>
            <h2 className="font-display text-lg font-black text-white uppercase tracking-wide">
              Report Detail
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Image */}
          {imgSrc ? (
            <div className="relative bg-black">
              <img
                src={imgSrc}
                alt="report"
                className="w-full max-h-72 object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-card/90 to-transparent" />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <SeverityBadge severity={sev} size="sm" />
                <StatusBadge status={(report.status as any) ?? 'reported'} size="sm" />
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-bg-elevated flex items-center justify-center border-b border-border">
              <p className="text-xs text-gray-600 uppercase tracking-widest">No image</p>
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Title */}
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-amber mb-1">
                {report.category?.replace(/_/g, ' ') || 'Road Damage'}
              </p>
              <p className="text-white text-sm leading-relaxed">
                {report.description || <span className="text-gray-500 italic">No description provided</span>}
              </p>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border">
              <PriorityRing score={displayPri} size={56} />
              <div className="flex-1 space-y-2">
                <SeverityBar
                  score={displaySev}
                  label="Severity Score"
                  displayText={`${rawSev.toFixed(1)}/15`}
                />
                <SeverityBar score={displayPri} label="Priority Score" />
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { icon: Clock, label: 'Reported', val: formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) },
                { icon: ThumbsUp, label: 'Upvotes', val: String(report.upvote_count ?? 0) },
                report.lat != null && { icon: MapPin, label: 'Coordinates', val: `${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}` },
                report.updated_at && { icon: RefreshCw, label: 'Last Updated', val: formatDistanceToNow(new Date(report.updated_at), { addSuffix: true }) },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex items-center gap-2 p-2.5 bg-bg-elevated rounded-xl border border-border">
                  <item.icon size={12} className="text-amber flex-shrink-0" />
                  <div>
                    <p className="text-gray-500">{item.label}</p>
                    <p className="text-white font-medium">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini Map */}
            {report.lat != null && report.lng != null && (
              <div className="rounded-xl overflow-hidden border border-border">
                <MapContainer
                  center={[report.lat, report.lng]} zoom={14}
                  style={{ height: '140px' }}
                  scrollWheelZoom={false} dragging={false} zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[report.lat, report.lng]} />
                </MapContainer>
                <a
                  href={`https://maps.google.com/?q=${report.lat},${report.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 text-xs text-amber hover:bg-white/5 transition"
                >
                  <ExternalLink size={11} /> Open in Google Maps
                </a>
              </div>
            )}

            {/* Disputes */}
            {disputes.length > 0 && (
              <div>
                <p className="text-xs font-display uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={11} /> {disputes.length} Dispute{disputes.length !== 1 ? 's' : ''} Filed
                </p>
                <div className="space-y-2">
                  {disputes.map((d: any) => (
                    <div key={d.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs">
                      <p className="text-red-300 font-semibold capitalize">{d.reason?.replace(/_/g, ' ')}</p>
                      {d.comment && <p className="text-gray-400 mt-1">{d.comment}</p>}
                      <p className="text-gray-600 mt-1">{formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Status Update ── */}
            <div className="p-4 bg-bg-elevated rounded-xl border border-border space-y-3">
              <p className="text-xs font-display uppercase tracking-widest text-white mb-2 flex items-center gap-1.5">
                <Brain size={13} className="text-amber" /> Update Status
              </p>

              {/* Status select */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">New Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="cs-input w-full pl-3 pr-8 py-2.5 rounded-xl text-sm appearance-none"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Remark / Note
                  {status === 'resolved' && (
                    <span className="ml-1 text-amber">* required for resolve — will be emailed to reporter</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder={
                    status === 'resolved'
                      ? 'Describe the resolution. This message will be emailed to the reporter…'
                      : 'Optional note about this status change…'
                  }
                  className={`cs-input w-full px-3 py-2.5 rounded-xl text-sm resize-none ${
                    status === 'resolved' && !remark.trim() ? 'border-amber/40' : ''
                  }`}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saving
                  ? <><div className="spinner w-4 h-4 border-2" /> Saving…</>
                  : status === 'resolved'
                    ? <><Send size={14} /> Resolve & Notify Reporter</>
                    : <><CheckCircle2 size={14} /> Update Status</>}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};


// ─── Create User Tab ──────────────────────────────────────────────────────────
const CreateUserTab: React.FC = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.username || !form.email || !form.password) { toast.error('All fields are required.'); return; }
    setLoading(true);
    try {
      await adminAPI.createUser({ username: form.username, email: form.email, password: form.password });
      if (form.role === 'admin') {
        await adminAPI.promoteToAdmin(form.email);
        toast.success(`Admin account created for ${form.email}`);
      } else {
        toast.success(`User account created for ${form.email}`);
      }
      setForm({ username: '', email: '', password: '', role: 'user' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create user.');
    } finally { setLoading(false); }
  };

  const handlePromote = async () => {
    if (!form.email) { toast.error('Enter an email address.'); return; }
    setLoading(true);
    try {
      await adminAPI.promoteToAdmin(form.email);
      toast.success(`${form.email} promoted to admin!`);
      setForm(p => ({ ...p, email: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'User not found or already admin.');
    } finally { setLoading(false); }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', ph = '') => (
    <div>
      <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={ph} className="cs-input w-full px-4 py-3 rounded-xl text-sm" />
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="cs-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={18} className="text-amber" />
          <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Create New User</h3>
        </div>
        {field('username', 'Username', 'text', 'john_doe')}
        {field('email',    'Email',    'email','john@example.com')}
        {field('password', 'Password', 'password', 'Min 8 characters')}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Role</label>
          <div className="flex gap-2">
            {['user', 'admin'].map(r => (
              <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-display uppercase tracking-wider border transition-all ${
                  form.role === r ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
                }`}>
                {r === 'admin' ? 'Admin' : 'Citizen'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleCreate} disabled={loading}
          className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40">
          {loading ? <><div className="spinner w-4 h-4 border-2" /> Creating…</> : <><Plus size={15} /> Create Account</>}
        </button>
      </div>

      <div className="cs-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck size={18} className="text-cyan-400" />
          <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Promote to Admin</h3>
        </div>
        <p className="text-sm text-gray-400">Grant admin privileges to an existing user by email.</p>
        {field('email', 'Existing User Email', 'email', 'user@example.com')}
        <button onClick={handlePromote} disabled={loading}
          className="w-full py-3 rounded-xl text-sm border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-40">
          <UserCheck size={15} /> Promote to Admin
        </button>
      </div>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const [users, setUsers]   = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getUsers()
      .then(res => {
        const data = (res.data as any)?.users ?? [];
        setUsers(Array.isArray(data) ? data.map((u: any) => ({
          id: u._id ?? u.id, username: u.username ?? u.name,
          email: u.email, role: u.role, createdAt: u.createdAt ?? new Date().toISOString(),
        })) : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = async (u: MockUser) => {
    if (!window.confirm(`Delete user ${u.username}?`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      toast.success('User deleted.');
    } catch { toast.error('Failed to delete user.'); }
  };

  const promote = async (u: MockUser) => {
    try {
      await adminAPI.promoteToAdmin(u.email);
      setUsers(p => p.map(x => x.id === u.id ? { ...x, role: 'admin' } : x));
      toast.success(`${u.username} promoted to admin!`);
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Failed.'); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8 border-2" /></div>;

  return (
    <div className="cs-card overflow-hidden">
      <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Registered Users</h3>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="cs-input pl-8 pr-4 py-2 rounded-lg text-sm w-52" />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{users.length === 0 ? 'No users found' : 'No users match search'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              {['User', 'Email', 'Role', 'Joined', 'Actions'].map(col => (
                <th key={col} className="text-left px-4 py-3 text-xs font-display uppercase tracking-widest text-gray-500">{col}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border hover:bg-white/3 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-sm font-display font-bold text-amber">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-white">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-display uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-amber/10 border-amber/20 text-amber' : 'bg-bg-elevated border-border text-gray-400'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {u.role !== 'admin' && (
                        <button onClick={() => promote(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition">
                          <UserCheck size={11} /> Promote
                        </button>
                      )}
                      <button onClick={() => deleteUser(u)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="p-4 border-t border-border text-xs text-gray-500">
        Showing {filtered.length} of {users.length} users
      </div>
    </div>
  );
};

// ─── Reports Tab ──────────────────────────────────────────────────────────────
const ReportsTab: React.FC = () => {
  const [reports, setReports]   = useState<BackendReport[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [sevFilter, setSevFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<BackendReport | null>(null);

  const load = () => {
    setLoading(true);
    adminAPI.getAllReports()
      .then(res => setReports(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const categories = [...new Set(reports.map(r => r.category))].filter(Boolean);

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.id.includes(search);
    const matchCat    = !catFilter    || r.category === catFilter;
    const matchSev    = !sevFilter    || severityLabel(scaleSev(r.severity_score)) === sevFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchCat && matchSev && matchStatus;
  }).sort((a, b) => b.priority_score - a.priority_score);

  const handleUpdated = (updated: BackendReport) => {
    setReports(p => p.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  const deleteReport = async (report: BackendReport, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete report #${report.id.slice(-8)}?`)) return;
    try {
      await adminAPI.deleteReport(report.id);
      setReports(p => p.filter(r => r.id !== report.id));
      toast.success('Report deleted.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to delete report.');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8 border-2" /></div>;

  return (
    <>
      <div className="cs-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
          <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">All Reports</h3>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search description, ID..." className="cs-input pl-8 pr-4 py-2 rounded-lg text-sm w-52" />
          </div>

          {[
            { val: catFilter, set: setCatFilter, opts: categories.map(c => ({ v: c, l: c.replace(/_/g, ' ') })), placeholder: 'All Categories' },
            { val: sevFilter, set: setSevFilter, opts: ['critical','high','medium','low'].map(v => ({ v, l: v })), placeholder: 'All Severities' },
            { val: statusFilter, set: setStatusFilter, opts: STATUS_OPTIONS.map(v => ({ v, l: v.replace(/_/g, ' ') })), placeholder: 'All Statuses' },
          ].map((f, idx) => (
            <div key={idx} className="relative">
              <select value={f.val} onChange={e => f.set(e.target.value)}
                className="cs-input pr-8 pl-3 py-2 rounded-lg text-sm appearance-none cursor-pointer capitalize">
                <option value="">{f.placeholder}</option>
                {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          ))}

          <button onClick={load} className="ml-auto flex items-center gap-1.5 btn-secondary px-3 py-2 rounded-lg text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              {['', 'Description', 'Category', 'Severity', 'Priority', 'Upvotes', 'Age', 'Status', ''].map((col, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-display uppercase tracking-widest text-gray-500">{col}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((report, i) => {
                const displaySev = scaleSev(report.severity_score);
                const displayPri = scalePri(report.priority_score);
                const imgSrc = resolveImg(report.image_url);
                return (
                  <motion.tr key={report.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(report)}
                    className="border-b border-border hover:bg-white/5 transition group cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <td className="pl-4 py-3 w-12">
                      {imgSrc ? (
                        <img src={imgSrc} alt="" className="w-10 h-10 rounded-lg object-cover border border-border"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
                          <Eye size={13} className="text-gray-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-sm text-gray-300 truncate">{report.description || <span className="text-gray-600 italic">No description</span>}</p>
                      <p className="text-xs font-mono text-gray-600 mt-0.5">#{report.id.slice(-8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 capitalize">{report.category?.replace(/_/g, ' ') || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={severityLabel(displaySev)} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityRing score={displayPri} size={40} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><ThumbsUp size={11} />{report.upvote_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={(report.status as any) ?? 'reported'} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-amber opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          Open <ChevronRight size={12} />
                        </span>
                        <button onClick={e => deleteReport(report, e)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-500 font-display uppercase tracking-widest text-sm">No reports match filters</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filtered.length} of {reports.length} reports — click any row to open</span>
          <span className="font-mono">{new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Report Detail Panel */}
      <AnimatePresence>
        {selected && (
          <ReportDetailPanel
            report={selected}
            onClose={() => setSelected(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Admin Header ─────────────────────────────────────────────────────────────
const AdminHeader: React.FC = () => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setToolsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-amber/10 border border-amber/20 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-amber" />
          </div>
          <h1 className="font-display text-4xl font-black text-white uppercase tracking-wide">Admin Panel</h1>
        </div>
        <p className="text-gray-400 text-sm">Manage reports, users, and community feedback</p>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => window.print()} className="flex items-center gap-2 btn-secondary px-4 py-2.5 rounded-xl text-sm">
          <Download size={15} /> Export
        </button>
        <div ref={ref} className="relative">
          <button onClick={() => setToolsOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${
              toolsOpen ? 'bg-amber/10 border-amber/30 text-amber' : 'btn-secondary border-border'
            }`}>
            <List size={15} /> Tools
            <ChevronDown size={13} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {toolsOpen && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 mt-2 w-52 glass rounded-xl border border-border shadow-elevated overflow-hidden z-30">
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-xs text-gray-600 font-display uppercase tracking-widest">Server Tools</p>
                </div>
                <a href="http://localhost:5000/admin/queues" target="_blank" rel="noopener noreferrer"
                  onClick={() => setToolsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-amber transition">
                  <div className="w-6 h-6 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center">
                    <List size={12} className="text-amber" />
                  </div>
                  <div>
                    <p className="font-medium leading-tight">Queue Dashboard</p>
                    <p className="text-xs text-gray-600 mt-0.5">Bull / job queue monitor</p>
                  </div>
                  <ExternalLink size={11} className="text-gray-600 ml-auto" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [tab, setTab]         = useState<TabId>('reports');
  const [reports, setReports] = useState<BackendReport[]>([]);

  useEffect(() => {
    adminAPI.getAllReports()
      .then(res => setReports(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  const stats = {
    total:    reports.length,
    open:     reports.filter(r => ['reported','open','under-review','assigned','in_progress'].includes(r.status ?? '')).length,
    resolved: reports.filter(r => r.status === 'resolved' || r.status === 'closed').length,
    critical: reports.filter(r => scaleSev(r.severity_score) >= 80).length,
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'reports', label: 'Reports',     icon: AlertTriangle },
    { id: 'users',   label: 'Users',       icon: Users },
    { id: 'create',  label: 'Create User', icon: Plus },
  ];

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Reports', val: stats.total,    icon: TrendingUp,   accent: 'text-amber',      bg: 'bg-amber/10 border-amber/20' },
            { label: 'Open',          val: stats.open,     icon: Clock,        accent: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Resolved',      val: stats.resolved, icon: CheckCircle2, accent: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Critical',      val: stats.critical, icon: Zap,          accent: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="cs-card p-4 hover:scale-[1.02] transition-transform duration-200">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${s.bg}`}>
                <s.icon size={18} className={s.accent} />
              </div>
              <div className="font-display text-3xl font-black text-white">{s.val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-bg-elevated p-1 rounded-xl border border-border w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display uppercase tracking-wider transition-all ${
                tab === t.id ? 'bg-amber/10 border border-amber/20 text-amber' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}>
            {tab === 'reports' && <ReportsTab />}
            {tab === 'users'   && <UsersTab />}
            {tab === 'create'  && <CreateUserTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
