import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, ThumbsUp, MessageCircle, Clock,
  Share2, CheckCircle2, Zap, BarChart3,
  DollarSign, Activity, Brain, AlertTriangle, X,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { SeverityBadge, StatusBadge, PriorityRing, SeverityBar } from '../components/SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { upvoteAPI, reportsAPI, disputeAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import type { BackendReport } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityFromScore = (score: number): 'critical' | 'high' | 'medium' | 'low' =>
  score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';

// ─── IssueDetail ──────────────────────────────────────────────────────────────
const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [report, setReport] = useState<BackendReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Upvote state
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [upvoteLoading, setUpvoteLoading] = useState(false);

  // Comments (frontend-only for now — no backend endpoint)
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{ id: string; text: string; author: string; role: string; createdAt: string }[]>([]);

  // ── Load report ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    // Backend has no GET /reports/:id yet — fetch all and find by id
    reportsAPI.getAll()
      .then(res => {
        const list: BackendReport[] = Array.isArray(res.data) ? res.data : [];
        const found = list.find(r => String(r.id) === String(id));
        setReport(found ?? null);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Load upvote state ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    // Backend returns: { upvotes: number } and { hasUpvoted: boolean }
    Promise.all([
      upvoteAPI.getCount(id).catch(() => ({ data: { upvotes: 0 } })),
      upvoteAPI.getStatus(id).catch(() => ({ data: { hasUpvoted: false } })),
    ]).then(([countRes, statusRes]) => {
      setUpvoteCount((countRes.data as any)?.upvotes ?? 0);
      setUpvoted((statusRes.data as any)?.hasUpvoted ?? false);
    });
  }, [id]);

  // ── Handle upvote ───────────────────────────────────────────────────────────
  const handleUpvote = async () => {
    if (!id) return;
    if (!user) { toast.error('Please log in to upvote.'); return; }
    setUpvoteLoading(true);
    try {
      await upvoteAPI.toggle(id);
      setUpvoted(p => !p);
      setUpvoteCount(p => upvoted ? p - 1 : p + 1);
      toast.success(upvoted ? 'Upvote removed' : 'Upvoted!');
    } catch {
      toast.error('Failed to upvote. Please try again.');
    } finally {
      setUpvoteLoading(false);
    }
  };

  // ── Handle comment (local-only) ─────────────────────────────────────────────
  const handleComment = () => {
    if (!comment.trim()) return;
    setComments(p => [...p, {
      id: `c${p.length + 1}`,
      text: comment,
      // Your own comments show your name; admin shows admin name
      author: user?.role === 'admin' ? (user.name ?? 'Admin') : (user?.name ?? 'Anonymous Citizen'),
      role: user?.role ?? 'user',
      createdAt: new Date().toISOString(),
    }]);
    setComment('');
    toast.success('Comment added!');
  };

  // ── Share ────────────────────────────────────────────────────────────────────
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  // ── Dispute ──────────────────────────────────────────────────────────────────
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('not_fixed');
  const [disputeComment, setDisputeComment] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeFiled, setDisputeFiled] = useState(false);

  const handleDisputeSubmit = async () => {
    if (!id) return;
    setDisputeSubmitting(true);
    try {
      await disputeAPI.file(id, disputeReason, disputeComment || undefined);
      setDisputeFiled(true);
      setDisputeOpen(false);
      toast.success('Dispute filed. Authorities have been notified.');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to file dispute.';
      toast.error(msg);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // ── Loading / Not found ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-10 h-10 border-2 mx-auto mb-4" />
          <p className="text-gray-500 font-display uppercase tracking-widest text-sm">Loading Report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl font-black text-white mb-2">Report Not Found</p>
          <p className="text-gray-500 text-sm mb-6">The report you're looking for doesn't exist or was removed.</p>
          <Link to="/issues" className="btn-primary px-6 py-3 rounded-xl inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  const severity = severityFromScore(report.severity_score);
  const status = (report.status as any) ?? 'open';

  // Parse location from PostGIS if available
  let lat: number | null = null;
  let lng: number | null = null;
  try {
    if (typeof report.location === 'string') {
      // PostGIS returns something like "0101000020E6100000..."
      // Real lat/lng not extractable from binary without postgis client
    } else if (report.location && typeof report.location === 'object') {
      const loc = report.location as any;
      lat = loc.lat ?? loc.coordinates?.[1] ?? null;
      lng = loc.lng ?? loc.coordinates?.[0] ?? null;
    }
  } catch { /* ignore */ }

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link to="/issues" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber transition mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Issues
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left (Main) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cs-card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <SeverityBadge severity={severity} size="md" />
                    <StatusBadge status={status} />
                    <span className="text-xs font-mono text-gray-500">#{report.id}</span>
                  </div>
                  <h1 className="font-display text-3xl font-black text-white leading-tight">
                    {report.category?.replace('_', ' ').toUpperCase() || 'ROAD DAMAGE REPORT'}
                  </h1>
                </div>
                <PriorityRing score={report.priority_score} size={72} />
              </div>

              {/* Description */}
              {report.description && (
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{report.description}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-border pt-4">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1.5 capitalize">
                  <MapPin size={13} className="text-amber" />
                  {report.category?.replace('_', ' ') || 'Unknown category'}
                </span>
                {/* Reporter name:
                    - Own report  → show own name
                    - Admin       → show user ID (real name not stored in report)
                    - Others      → Anonymous Citizen */}
                <span className="flex items-center gap-1.5 text-xs font-mono">
                  Reported by:{' '}
                  {report.created_by === user?.id
                    ? <span className="text-amber">{user.name} (You)</span>
                    : user?.role === 'admin'
                      ? <span className="text-gray-300">User {report.created_by?.slice(-6)}</span>
                      : <span>Anonymous Citizen</span>
                  }
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={handleUpvote}
                  disabled={upvoteLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all disabled:opacity-60 ${
                    upvoted
                      ? 'bg-amber/10 border-amber/30 text-amber'
                      : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20 hover:text-amber'
                  }`}
                >
                  <ThumbsUp size={14} className={upvoted ? 'fill-amber' : ''} />
                  {upvoteCount} Upvote{upvoteCount !== 1 ? 's' : ''}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-border bg-bg-elevated text-gray-400 hover:border-amber/20 transition"
                >
                  <Share2 size={14} /> Share
                </button>

                {/* Dispute button — only for resolved/closed reports, non-admin users */}
                {(status === 'resolved' || status === 'closed') && user && user.role !== 'admin' && (
                  disputeFiled ? (
                    <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-green-500/30 bg-green-500/10 text-green-400">
                      <CheckCircle2 size={14} /> Dispute Filed
                    </span>
                  ) : (
                    <button
                      onClick={() => setDisputeOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    >
                      <AlertTriangle size={14} /> Report Not Fixed
                    </button>
                  )
                )}
              </div>
            </motion.div>

            {/* Image */}
            {report.image_url && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="cs-card p-4">
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3">Photo</h3>
                <div className="rounded-xl overflow-hidden max-h-80 bg-bg-elevated">
                  <img
                    src={`http://localhost:5000${report.image_url}`}
                    alt="report"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            )}

            {/* Status Timeline */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cs-card p-5">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-5">Resolution Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-5">
                  {[
                    { label: 'Reported',        done: true,                                       active: false },
                    { label: 'AI Analysed',     done: true,                                       active: false },
                    { label: 'Under Review',    done: status !== 'open',                          active: status === 'open' },
                    { label: 'In Progress',     done: status === 'resolved' || status === 'closed', active: status === 'in_progress' },
                    { label: 'Resolved',        done: status === 'resolved' || status === 'closed', active: false },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-4 relative pl-10">
                      <div className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        step.done
                          ? 'bg-amber border-amber text-white'
                          : step.active
                            ? 'bg-bg-card border-amber text-amber animate-pulse'
                            : 'bg-bg-card border-border text-gray-600'
                      }`}>
                        {step.done ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${step.done || step.active ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                          {step.active && <span className="ml-2 text-xs text-amber font-normal animate-pulse">● Current</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Comments */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="cs-card p-5">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <MessageCircle size={16} /> Comments ({comments.length})
              </h3>

              {comments.length === 0 && (
                <p className="text-gray-600 text-sm mb-4">No comments yet. Be the first to add context.</p>
              )}

              <div className="space-y-4 mb-5">
                {comments.map(c => (
                  <div key={c.id} className={`flex gap-3 p-3 rounded-xl ${c.role === 'admin' ? 'bg-amber/5 border border-amber/10' : 'bg-bg-elevated'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display font-bold flex-shrink-0 ${
                      c.role === 'admin' ? 'bg-amber/20 text-amber' : 'bg-bg-secondary text-gray-400'
                    }`}>
                      {c.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{c.author}</span>
                        {c.role === 'admin' && (
                          <span className="text-xs px-2 py-0.5 bg-amber/10 text-amber rounded-full border border-amber/20 font-display uppercase tracking-wider">Admin</span>
                        )}
                        <span className="text-xs text-gray-600">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    placeholder="Add a comment..."
                    className="cs-input flex-1 px-4 py-2.5 rounded-xl text-sm"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!comment.trim()}
                    className="btn-primary px-4 py-2.5 rounded-xl text-sm disabled:opacity-40"
                  >
                    Post
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  <Link to="/login" className="text-amber hover:underline">Log in</Link> to leave a comment.
                </p>
              )}
            </motion.div>
          </div>

          {/* ── Right (Sidebar) ── */}
          <div className="space-y-4">

            {/* AI Analysis Card */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="cs-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-amber" />
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide">AI Analysis</h3>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-bg-elevated rounded-xl">
                <PriorityRing score={report.priority_score} size={56} />
                <div>
                  <SeverityBadge severity={severity} size="md" />
                  <p className="text-sm font-bold text-white mt-1 capitalize">
                    {report.category?.replace('_', ' ') || 'Road Damage'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <SeverityBar score={report.severity_score} label="Severity Score" />
                <SeverityBar score={report.priority_score} label="Priority Score" />
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { icon: BarChart3,  label: 'Severity Score', val: `${report.severity_score}/100` },
                  { icon: DollarSign, label: 'Priority Score',  val: `${report.priority_score}/100` },
                  { icon: Clock,      label: 'SLA Target',      val: severity === 'critical' ? '< 24 h' : severity === 'high' ? '< 48 h' : '< 7 days' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="flex items-center gap-1.5 text-gray-500"><s.icon size={12} />{s.label}</span>
                    <span className="font-medium text-white">{s.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Location map */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="cs-card p-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-amber" /> Location
              </h3>

              {lat !== null && lng !== null ? (
                <>
                  <MapContainer
                    center={[lat, lng]}
                    zoom={14}
                    style={{ height: '160px', borderRadius: '12px', border: '1px solid #1E293B' }}
                    scrollWheelZoom={false}
                    dragging={false}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lat, lng]} />
                  </MapContainer>
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center gap-2 btn-secondary py-2 rounded-xl text-xs"
                  >
                    <MapPin size={12} /> Open in Google Maps
                  </a>
                </>
              ) : (
                <div className="h-40 bg-bg-elevated rounded-xl border border-border flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-amber/20 border-2 border-amber rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse-slow">
                      <MapPin size={18} className="text-amber" />
                    </div>
                    <p className="text-xs text-gray-500">Location data stored as PostGIS</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Status card */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="cs-card p-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                <Activity size={15} className="text-cyan-400" /> Status
              </h3>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={status} size="md" />
                <span className="text-xs font-mono text-gray-500">
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber">
                <Zap size={11} />
                SLA Target: {severity === 'critical' ? '24 hours' : severity === 'high' ? '48 hours' : '7 days'}
              </div>
            </motion.div>

            {/* Upvote CTA */}
            {!upvoted && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="cs-card p-4 border-amber/20 bg-amber/5">
                <p className="text-sm font-semibold text-white mb-1">This issue affect you?</p>
                <p className="text-xs text-gray-400 mb-3">
                  Upvote to increase its priority and get it fixed faster.
                </p>
                <button
                  onClick={handleUpvote}
                  disabled={upvoteLoading}
                  className="w-full btn-primary py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ThumbsUp size={14} /> Upvote ({upvoteCount})
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dispute Modal ─────────────────────────────────────────────────────── */}
      {disputeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDisputeOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-md cs-card p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} className="text-red-400" />
                  <h2 className="font-display text-lg font-bold text-white">Dispute Resolution</h2>
                </div>
                <p className="text-xs text-gray-500">
                  Flag this report if the issue was marked fixed but the problem still exists.
                </p>
              </div>
              <button
                onClick={() => setDisputeOpen(false)}
                className="text-gray-500 hover:text-white transition ml-4 flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Reason picker */}
            <div className="space-y-2 mb-5">
              <p className="text-xs font-display uppercase tracking-widest text-gray-400 mb-3">Reason</p>
              {[
                { value: 'not_fixed',        label: 'Issue is still not fixed',          desc: 'The problem persists exactly as reported.' },
                { value: 'partially_fixed',  label: 'Only partially fixed',              desc: 'Some work was done but the issue remains.' },
                { value: 'recurring_issue',  label: 'Issue has come back',               desc: 'It was fixed but the problem has returned.' },
                { value: 'wrong_location',   label: 'Wrong location was marked',         desc: 'The fix happened at a different spot.' },
                { value: 'other',            label: 'Other reason',                      desc: 'Explain below.' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    disputeReason === opt.value
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-border bg-bg-elevated hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="dispute-reason"
                    value={opt.value}
                    checked={disputeReason === opt.value}
                    onChange={e => setDisputeReason(e.target.value)}
                    className="mt-0.5 accent-red-500 flex-shrink-0"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${disputeReason === opt.value ? 'text-red-300' : 'text-white'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Optional comment */}
            <div className="mb-5">
              <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
                Additional details <span className="text-gray-600 normal-case">(optional)</span>
              </label>
              <textarea
                value={disputeComment}
                onChange={e => setDisputeComment(e.target.value)}
                rows={3}
                placeholder="Describe what you observed..."
                className="cs-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setDisputeOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border bg-bg-elevated text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDisputeSubmit}
                disabled={disputeSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition disabled:opacity-50 font-semibold"
              >
                {disputeSubmitting ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;
