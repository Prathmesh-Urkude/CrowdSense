/**
 * Admin Dashboard
 *
 * Tabs:
 *  1. Reports   — view all reports with filters, update status, delete, send feedback
 *  2. Users     — list / delete users, promote to admin
 *  3. Create    — register new user + optionally promote to admin
 *
 * Backend wired endpoints:
 *  GET  /reports                 → list reports
 *  POST /admin/create-admin      → promote user to admin by email
 *  POST /auth/signup             → create new user
 *
 * UI-only (backend endpoints don't exist yet — toast explains):
 *  PATCH /reports/:id/status     → update status
 *  DELETE /reports/:id           → delete report
 *  GET   /admin/users            → list users
 *  DELETE /admin/users/:id       → delete user
 *  POST  /admin/reports/:id/feedback → send feedback
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, Users, Download,
  ChevronDown, Search, MoreVertical, Zap, TrendingUp,
  RefreshCw, Shield, Plus, Trash2, MessageSquare,
  UserCheck, X, Send, Eye, ExternalLink, List,
} from 'lucide-react';
import { SeverityBadge, StatusBadge, PriorityRing } from '../components/SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { reportsAPI, adminAPI, disputeAPI } from '../utils/api';
import type { BackendReport, IssueStatus } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MockUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

type TabId = 'reports' | 'users' | 'create';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityLabel = (score: number): 'critical' | 'high' | 'medium' | 'low' =>
  score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

const statusOptions: IssueStatus[] = ['pending', 'open', 'in_progress', 'resolved', 'closed'];

// ─── Feedback Modal ───────────────────────────────────────────────────────────
const FeedbackModal: React.FC<{
  report: BackendReport;
  onClose: () => void;
}> = ({ report, onClose }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) { toast.error('Please write a message.'); return; }
    setSending(true);
    try {
      await adminAPI.sendFeedback(report.id, message);
      toast.success('Feedback sent to the reporter!');
      onClose();
    } catch (err: any) {
      // If backend endpoint doesn't exist yet, show friendly message
      if (err?.response?.status === 404) {
        toast('Feedback endpoint not yet available on the server.', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to send feedback.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="cs-card w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-amber" />
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              Send Feedback
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 bg-bg-elevated rounded-xl border border-border mb-4">
          <p className="text-xs text-gray-500 mb-1">Regarding Report #{report.id}</p>
          <p className="text-sm text-gray-300 line-clamp-2">{report.description || 'No description'}</p>
        </div>

        <textarea
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write your feedback or status update for the citizen who reported this issue..."
          className="cs-input w-full px-4 py-3 rounded-xl text-sm resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-3 rounded-xl text-sm">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending || !message.trim()}
            className="btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {sending ? <><div className="spinner w-4 h-4 border-2" /> Sending...</> : <><Send size={14} /> Send Feedback</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Disputes Modal ───────────────────────────────────────────────────────────
interface Dispute {
  id: string;
  report_id: string;
  user_id: string;
  reason: string;
  comment: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  not_fixed:        'Issue still not fixed',
  partially_fixed:  'Only partially fixed',
  recurring_issue:  'Issue has come back',
  wrong_location:   'Wrong location marked',
  other:            'Other reason',
};

const DisputesModal: React.FC<{
  report: BackendReport;
  onClose: () => void;
}> = ({ report, onClose }) => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disputeAPI.getForReport(report.id)
      .then(res => setDisputes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, [report.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="cs-card w-full max-w-lg p-6 max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              Disputes
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 bg-bg-elevated rounded-xl border border-border mb-4 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-1">Report #{report.id.slice(-8)}</p>
          <p className="text-sm text-gray-300 line-clamp-2">{report.description || 'No description'}</p>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10"><div className="spinner w-6 h-6 border-2" /></div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No disputes filed for this report.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(d => (
                <div key={d.id} className="p-4 bg-bg-elevated rounded-xl border border-red-500/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full font-display uppercase tracking-wider">
                      {REASON_LABELS[d.reason] ?? d.reason}
                    </span>
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mb-1">User: …{d.user_id.slice(-8)}</p>
                  {d.comment && (
                    <p className="text-sm text-gray-300 leading-relaxed mt-2 pt-2 border-t border-border">
                      {d.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full py-3 rounded-xl text-sm">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Create User / Admin Form ─────────────────────────────────────────────────
const CreateUserTab: React.FC = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.username || !form.email || !form.password) {
      toast.error('All fields are required.'); return;
    }
    setLoading(true);
    try {
      // Step 1: create the user via public signup
      await adminAPI.createUser({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Step 2: if admin role selected, promote immediately
      if (form.role === 'admin') {
        await adminAPI.promoteToAdmin(form.email);
        toast.success(`Admin account created for ${form.email}`);
      } else {
        toast.success(`User account created for ${form.email}`);
      }
      setForm({ username: '', email: '', password: '', role: 'user' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteExisting = async () => {
    if (!form.email) { toast.error('Enter an email address to promote.'); return; }
    setLoading(true);
    try {
      await adminAPI.promoteToAdmin(form.email);
      toast.success(`${form.email} promoted to admin!`);
      setForm(p => ({ ...p, email: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'User not found or already admin.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="cs-input w-full px-4 py-3 rounded-xl text-sm"
      />
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Create new user */}
      <div className="cs-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={18} className="text-amber" />
          <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Create New User</h3>
        </div>
        {field('username', 'Username', 'text', 'e.g. john_doe')}
        {field('email',    'Email',    'email', 'e.g. john@example.com')}
        {field('password', 'Password', 'password', 'Min 8 characters')}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Role</label>
          <div className="flex gap-2">
            {['user', 'admin'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm(p => ({ ...p, role: r }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-display uppercase tracking-wider border transition-all ${
                  form.role === r
                    ? 'bg-amber/10 border-amber/30 text-amber'
                    : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
                }`}
              >
                {r === 'admin' ? 'Admin / Official' : 'Citizen'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? <><div className="spinner w-4 h-4 border-2" /> Creating...</> : <><Plus size={15} /> Create Account</>}
        </button>
      </div>

      {/* Promote existing user */}
      <div className="cs-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck size={18} className="text-cyan-400" />
          <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">Promote to Admin</h3>
        </div>
        <p className="text-sm text-gray-400">
          Enter the email of an existing registered user to grant them admin privileges.
        </p>
        {field('email', 'Existing User Email', 'email', 'user@example.com')}
        <button
          onClick={handlePromoteExisting}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <UserCheck size={15} /> Promote to Admin
        </button>
        <div className="p-3 bg-amber/5 border border-amber/20 rounded-xl text-xs text-gray-400">
          <strong className="text-amber">Note:</strong> Admin users can manage all reports,
          update statuses, send feedback to citizens, and create/manage other accounts.
        </div>
      </div>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getUsers()
      .then(res => {
        const data = (res.data as any)?.data ?? res.data;
        if (Array.isArray(data)) {
          setUsers(data.map((u: any) => ({
            id: u._id ?? u.id,
            username: u.username ?? u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt ?? new Date().toISOString(),
          })));
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = async (u: MockUser) => {
    if (!window.confirm(`Delete user ${u.username}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      toast.success('User deleted.');
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast('Delete user endpoint not yet available on the server.', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to delete user.');
      }
    }
  };

  const promote = async (u: MockUser) => {
    try {
      await adminAPI.promoteToAdmin(u.email);
      setUsers(p => p.map(x => x.id === u.id ? { ...x, role: 'admin' } : x));
      toast.success(`${u.username} promoted to admin!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to promote user.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="spinner w-8 h-8 border-2" />
    </div>
  );

  return (
    <div className="cs-card overflow-hidden">
      <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
          Registered Users
        </h3>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="cs-input pl-8 pr-4 py-2 rounded-lg text-sm w-52"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-display uppercase tracking-widest text-sm">
            {users.length === 0 ? 'Users endpoint not available yet' : 'No users match search'}
          </p>
          {users.length === 0 && (
            <p className="text-xs text-gray-600 mt-2">
              Add <code className="text-amber">GET /admin/users</code> to the backend to list users here.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-display uppercase tracking-widest text-gray-500">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
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
                      u.role === 'admin'
                        ? 'bg-amber/10 border-amber/20 text-amber'
                        : 'bg-bg-elevated border-border text-gray-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => promote(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
                        >
                          <UserCheck size={11} /> Promote
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(u)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                      >
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
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [feedbackReport, setFeedbackReport] = useState<BackendReport | null>(null);
  const [disputesReport, setDisputesReport] = useState<BackendReport | null>(null);

  const load = () => {
    setLoading(true);
    reportsAPI.getAll()
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
      String(r.id).includes(search);
    const matchCat = !categoryFilter || r.category === categoryFilter;
    const matchSev = !severityFilter || severityLabel(r.severity_score) === severityFilter;
    return matchSearch && matchCat && matchSev;
  }).sort((a, b) => b.priority_score - a.priority_score);

  const updateStatus = async (report: BackendReport, status: string) => {
    try {
      await reportsAPI.updateStatus(report.id, status);
      setReports(p => p.map(r => r.id === report.id ? { ...r, status } : r));
      toast.success(`Status updated to "${status.replace('_', ' ')}"`);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Optimistic UI update even without backend support
        setReports(p => p.map(r => r.id === report.id ? { ...r, status } : r));
        toast(`Status updated locally (backend endpoint pending).`, { icon: '⚠️' });
      } else {
        toast.error('Failed to update status.');
      }
    }
    setOpenMenu(null);
  };

  const deleteReport = async (report: BackendReport) => {
    if (!window.confirm(`Delete report #${report.id}? This cannot be undone.`)) return;
    try {
      await reportsAPI.delete(report.id);
      setReports(p => p.filter(r => r.id !== report.id));
      toast.success('Report deleted.');
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast('Delete report endpoint not yet available on the server.', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to delete report.');
      }
    }
    setOpenMenu(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="spinner w-8 h-8 border-2" />
    </div>
  );

  return (
    <>
      <div className="cs-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
          <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide">
            All Reports
          </h3>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by description, ID..."
              className="cs-input pl-8 pr-4 py-2 rounded-lg text-sm w-56"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="cs-input pr-8 pl-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Severity filter */}
          <div className="relative">
            <select
              value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              className="cs-input pr-8 pl-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Refresh */}
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 btn-secondary px-3 py-2 rounded-lg text-xs"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['ID', 'Description', 'Category', 'Severity', 'Priority', 'Reported', 'Status', 'Actions'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-display uppercase tracking-widest text-gray-500">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((report, i) => (
                <motion.tr
                  key={report.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border hover:bg-white/3 transition group"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                    #{report.id}
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="text-sm text-gray-300 truncate">
                      {report.description || <span className="text-gray-600 italic">No description</span>}
                    </p>
                    {report.image_url && (
                      <a
                        href={`http://localhost:5000${report.image_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Eye size={10} /> View photo
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-400 capitalize">
                      {report.category?.replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <SeverityBadge severity={severityLabel(report.severity_score)} size="sm" />
                    <p className="text-xs font-mono text-gray-600 mt-0.5">{report.severity_score}/100</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityRing score={report.priority_score} size={44} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      status={(report.status as any) ?? 'open'}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3.5 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === report.id ? null : report.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {openMenu === report.id && (
                      <div className="absolute right-12 top-0 z-20 w-48 glass rounded-xl border border-border shadow-elevated overflow-hidden">
                        {/* Status options */}
                        <div className="px-3 pt-2 pb-1">
                          <p className="text-xs text-gray-600 font-display uppercase tracking-widest mb-1">Update Status</p>
                        </div>
                        {statusOptions.map(opt => (
                          <button
                            key={opt}
                            onClick={() => updateStatus(report, opt)}
                            className={clsx(
                              'w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition',
                              (report.status ?? 'pending') === opt ? 'text-amber' : 'text-gray-300'
                            )}
                          >
                            {opt === 'pending'     ? '○ Pending'
                              : opt === 'open'        ? '● Open'
                              : opt === 'in_progress' ? '◎ In Progress'
                              : opt === 'resolved'    ? '✓ Resolved'
                              : '✕ Closed'}
                          </button>
                        ))}

                        <div className="border-t border-border mt-1">
                          {/* Send feedback */}
                          <button
                            onClick={() => { setFeedbackReport(report); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-2.5 text-xs text-cyan-400 hover:bg-white/5 transition flex items-center gap-2"
                          >
                            <MessageSquare size={11} /> Send Feedback
                          </button>

                          {/* View disputes (only for resolved/closed) */}
                          {(report.status === 'resolved' || report.status === 'closed') && (
                            <button
                              onClick={() => { setDisputesReport(report); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-white/5 transition flex items-center gap-2"
                            >
                              <AlertTriangle size={11} /> View Disputes
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => deleteReport(report)}
                            className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-white/5 transition flex items-center gap-2"
                          >
                            <Trash2 size={11} /> Delete Report
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
              <p className="text-gray-500 font-display uppercase tracking-widest text-sm">
                No reports match filters
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filtered.length} of {reports.length} reports</span>
          <span className="font-mono">{new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Feedback modal */}
      <AnimatePresence>
        {feedbackReport && (
          <FeedbackModal
            report={feedbackReport}
            onClose={() => setFeedbackReport(null)}
          />
        )}
      </AnimatePresence>

      {/* Disputes modal */}
      <AnimatePresence>
        {disputesReport && (
          <DisputesModal
            report={disputesReport}
            onClose={() => setDisputesReport(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Admin Header with Tools Dropdown ────────────────────────────────────────
const AdminHeader: React.FC = () => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8"
    >
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
        {/* Export */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 btn-secondary px-4 py-2.5 rounded-xl text-sm"
        >
          <Download size={15} /> Export
        </button>

        {/* Tools dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setToolsOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${
              toolsOpen
                ? 'bg-amber/10 border-amber/30 text-amber'
                : 'btn-secondary border-border'
            }`}
          >
            <List size={15} />
            Tools
            <ChevronDown size={13} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {toolsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-52 glass rounded-xl border border-border shadow-elevated overflow-hidden z-30"
              >
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-xs text-gray-600 font-display uppercase tracking-widest">Server Tools</p>
                </div>

                <a
                  href="http://localhost:5000/admin/queues"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setToolsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-amber transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
                    <List size={12} className="text-amber" />
                  </div>
                  <div>
                    <p className="font-medium leading-tight">Queue Dashboard</p>
                    <p className="text-xs text-gray-600 mt-0.5">Bull / job queue monitor</p>
                  </div>
                  <ExternalLink size={11} className="text-gray-600 ml-auto flex-shrink-0" />
                </a>

                <div className="h-px bg-border mx-3 my-1" />
                <div className="px-3 pb-2.5 pt-1 text-xs text-gray-600">
                  Opens at localhost:5000
                </div>
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
  const [tab, setTab] = useState<TabId>('reports');
  const [reports, setReports] = useState<BackendReport[]>([]);

  // Load summary stats
  useEffect(() => {
    reportsAPI.getAll()
      .then(res => setReports(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  const stats = {
    total:      reports.length,
    open:       reports.filter(r => !r.status || r.status === 'open').length,
    resolved:   reports.filter(r => r.status === 'resolved').length,
    critical:   reports.filter(r => r.severity_score >= 80).length,
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'reports', label: 'Reports',     icon: AlertTriangle },
    { id: 'users',   label: 'Users',       icon: Users },
    { id: 'create',  label: 'Create User', icon: Plus },
  ];

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <AdminHeader />

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Reports',   val: stats.total,    icon: TrendingUp,   accent: 'text-amber',      bg: 'bg-amber/10 border-amber/20' },
            { label: 'Open',            val: stats.open,     icon: Clock,        accent: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Resolved',        val: stats.resolved, icon: CheckCircle2, accent: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Critical',        val: stats.critical, icon: Zap,          accent: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="cs-card p-4 hover:scale-[1.02] transition-transform duration-200"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${s.bg}`}>
                <s.icon size={18} className={s.accent} />
              </div>
              <div className="font-display text-3xl font-black text-white">{s.val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mb-6 bg-bg-elevated p-1 rounded-xl border border-border w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display uppercase tracking-wider transition-all ${
                tab === t.id
                  ? 'bg-amber/10 border border-amber/20 text-amber'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
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
