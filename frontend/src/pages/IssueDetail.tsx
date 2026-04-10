import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, ThumbsUp, MessageCircle, Clock,
  Share2, Flag, CheckCircle2, User, Zap, BarChart3,
  DollarSign, Activity, Brain
} from 'lucide-react';
import { SeverityBadge, StatusBadge, PriorityRing, SeverityBar } from '../components/SeverityBadge';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Issue } from '../types';

// Sample mock issue — replace with API fetch using useParams id
const MOCK_ISSUE: Issue = {
  id: 'i001',
  title: 'Large pothole on MG Road near bus stop 14',
  description: 'There is a large, deep pothole near bus stop 14 on MG Road that has been causing vehicle damage for the past 2 weeks. Multiple vehicles including two-wheelers have been affected. The pothole is approximately 60cm wide and 15cm deep, making it extremely dangerous especially at night. Local commuters have reported at least 3 tyre punctures in the past week.',
  category: 'pothole', status: 'in_progress', severity: 'critical', priorityScore: 92,
  location: { address: 'MG Road, near Bus Stop 14, Pune', ward: 'Ward 14', city: 'Pune', coordinates: { lat: 18.5204, lng: 73.8567 } },
  images: [],
  aiAnalysis: {
    severity: 'critical', severityScore: 89, priorityScore: 92, confidence: 0.94,
    damageType: 'Deep Pothole', estimatedArea: 2.4, repairEstimate: '₹18,000 – ₹25,000',
    urgencyReason: 'High traffic zone, nighttime visibility risk',
    detectedFeatures: ['Deep pothole (>10cm)', 'Edge cracking', 'Surface deformation', 'Structural weakness'],
    boundingBoxes: [{ x: 120, y: 80, width: 180, height: 140, label: 'Pothole', confidence: 0.94 }],
  },
  reportedBy: { id: 'u1', name: 'Amit Sharma' },
  assignedTo: 'Rajan Kumar (PWD)',
  upvotes: 47, comments: [
    { id: 'c1', text: 'I hit this pothole yesterday, badly damaged my tyre!', author: 'Priya P.', role: 'citizen', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c2', text: 'This issue has been assigned to PWD Department. Expected resolution: 48 hours.', author: 'Official: Rajan Kumar', role: 'official', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'c3', text: 'Repair crew will be on site tomorrow morning.', author: 'Official: Rajan Kumar', role: 'official', createdAt: new Date(Date.now() - 900000).toISOString() },
  ],
  createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const STATUS_TIMELINE = [
  { label: 'Reported', time: 'Day 0', done: true, active: false },
  { label: 'AI Analyzed', time: 'Day 0', done: true, active: false },
  { label: 'Assigned to PWD', time: 'Day 0', done: true, active: true },
  { label: 'Work in Progress', time: 'Day 1', done: false, active: false },
  { label: 'Resolved', time: 'Day 2–4', done: false, active: false },
];

const IssueDetail: React.FC = () => {
  const { id } = useParams();
  const issue = MOCK_ISSUE; // In production: fetch from API using id
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(issue.upvotes);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(issue.comments);
  const [activeImg, setActiveImg] = useState(0);

  const handleUpvote = () => {
    if (upvoted) { setUpvotes(p => p - 1); setUpvoted(false); }
    else { setUpvotes(p => p + 1); setUpvoted(true); toast.success('Upvoted!'); }
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    setComments(p => [...p, {
      id: `c${p.length + 1}`, text: comment, author: 'You', role: 'citizen',
      createdAt: new Date().toISOString(),
    }]);
    setComment('');
    toast.success('Comment added!');
  };

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
                    <SeverityBadge severity={issue.severity} size="md" />
                    <StatusBadge status={issue.status} />
                    <span className="text-xs font-mono text-gray-500">#{issue.id.slice(-8)}</span>
                  </div>
                  <h1 className="font-display text-3xl font-black text-white leading-tight">{issue.title}</h1>
                </div>
                <PriorityRing score={issue.priorityScore} size={72} />
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-4">{issue.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-border pt-4">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber" />
                  {issue.location.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={13} />
                  {issue.reportedBy.name}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleUpvote}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${
                    upvoted ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
                  }`}
                >
                  <ThumbsUp size={14} className={upvoted ? 'fill-amber' : ''} />
                  {upvotes} Upvotes
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-border bg-bg-elevated text-gray-400 hover:border-amber/20 transition">
                  <Share2 size={14} /> Share
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-border bg-bg-elevated text-gray-400 hover:border-red-400/20 hover:text-red-400 transition ml-auto">
                  <Flag size={14} /> Report
                </button>
              </div>
            </motion.div>

            {/* Images */}
            {issue.images.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="cs-card p-4">
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3">Photos</h3>
                <div className="rounded-xl overflow-hidden h-56 bg-bg-elevated relative scan-container">
                  <img src={issue.images[activeImg]} alt="issue" className="w-full h-full object-cover" />
                </div>
                {issue.images.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {issue.images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-amber' : 'border-border'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {/* Placeholder when no real images */}
                {issue.images.length === 0 && (
                  <div className="rounded-xl h-48 bg-bg-elevated border border-border flex items-center justify-center">
                    <div className="text-center">
                      <MapPin size={32} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 font-display uppercase tracking-widest">No photos attached</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Status Timeline */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cs-card p-5">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-5">Resolution Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-5">
                  {STATUS_TIMELINE.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-4 relative pl-10">
                      <div className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        step.done ? 'bg-amber border-amber text-white' :
                        step.active ? 'bg-bg-card border-amber text-amber animate-pulse' :
                        'bg-bg-card border-border text-gray-600'
                      }`}>
                        {step.done ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${step.done || step.active ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                          {step.active && <span className="ml-2 text-xs text-amber font-normal animate-pulse">● Current</span>}
                        </p>
                      </div>
                      <span className={`text-xs font-mono ${step.done ? 'text-amber' : 'text-gray-600'}`}>{step.time}</span>
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
              <div className="space-y-4 mb-5">
                {comments.map(c => (
                  <div key={c.id} className={`flex gap-3 p-3 rounded-xl ${c.role !== 'citizen' ? 'bg-amber/5 border border-amber/10' : 'bg-bg-elevated'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display font-bold flex-shrink-0 ${
                      c.role === 'official' ? 'bg-amber/20 text-amber' : 'bg-bg-secondary text-gray-400'
                    }`}>
                      {c.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{c.author}</span>
                        {c.role !== 'citizen' && (
                          <span className="text-xs px-2 py-0.5 bg-amber/10 text-amber rounded-full border border-amber/20 font-display uppercase tracking-wider">Official</span>
                        )}
                        <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                  placeholder="Add a comment..."
                  className="cs-input flex-1 px-4 py-2.5 rounded-xl text-sm"
                />
                <button onClick={handleComment} disabled={!comment.trim()} className="btn-primary px-4 py-2.5 rounded-xl text-sm disabled:opacity-40">
                  Post
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Right (Sidebar) ── */}
          <div className="space-y-4">

            {/* AI Analysis Card */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="cs-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-amber" />
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide">AI Analysis</h3>
                <span className="ml-auto text-xs font-mono text-green-400">{(issue.aiAnalysis.confidence * 100).toFixed(0)}% conf.</span>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-bg-elevated rounded-xl">
                <PriorityRing score={issue.priorityScore} size={56} />
                <div>
                  <SeverityBadge severity={issue.severity} size="md" />
                  <p className="text-sm font-bold text-white mt-1">{issue.aiAnalysis.damageType}</p>
                  <p className="text-xs text-gray-500">{issue.aiAnalysis.urgencyReason}</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <SeverityBar score={issue.aiAnalysis.severityScore} label="Severity Score" />
                <SeverityBar score={issue.aiAnalysis.priorityScore} label="Priority Score" />
                <SeverityBar score={Math.round(issue.aiAnalysis.confidence * 100)} label="Confidence" />
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { icon: BarChart3, label: 'Damage Area',      val: `${issue.aiAnalysis.estimatedArea} m²` },
                  { icon: DollarSign, label: 'Repair Estimate', val: issue.aiAnalysis.repairEstimate },
                  { icon: Clock,      label: 'SLA',             val: issue.severity === 'critical' ? '< 24h' : '< 48h' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="flex items-center gap-1.5 text-gray-500"><s.icon size={12} />{s.label}</span>
                    <span className="font-medium text-white">{s.val}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2 font-display uppercase tracking-wider">Detected Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {issue.aiAnalysis.detectedFeatures.map(f => (
                    <span key={f} className="px-2 py-0.5 bg-bg-elevated rounded-full text-xs text-gray-400 border border-border">{f}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Location */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="cs-card p-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-amber" /> Location
              </h3>
              <div className="h-40 bg-bg-elevated rounded-xl border border-border flex items-center justify-center mb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="text-center relative">
                  <div className="w-10 h-10 bg-amber/20 border-2 border-amber rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse-slow">
                    <MapPin size={18} className="text-amber" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {issue.location.coordinates.lat.toFixed(4)}°N, {issue.location.coordinates.lng.toFixed(4)}°E
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-white font-medium">{issue.location.address}</p>
                <p className="text-gray-400 text-xs">{issue.location.ward} • {issue.location.city}</p>
              </div>
              <a
                href={`https://maps.google.com/?q=${issue.location.coordinates.lat},${issue.location.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 btn-secondary py-2 rounded-xl text-xs"
              >
                <MapPin size={12} /> Open in Google Maps
              </a>
            </motion.div>

            {/* Assignment */}
            {issue.assignedTo && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="cs-card p-4">
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Activity size={15} className="text-cyan-400" /> Assignment
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-display font-bold">
                    {issue.assignedTo.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{issue.assignedTo}</p>
                    <p className="text-xs text-gray-500">Assigned {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-amber">
                  <Zap size={11} /> SLA: {issue.severity === 'critical' ? '24 hours' : '48 hours'}
                </div>
              </motion.div>
            )}

            {/* Nearby */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="cs-card p-4">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wide mb-3">Nearby Issues</h3>
              <div className="space-y-2">
                {[
                  { title: 'FC Road crack', sev: 'high' as const, dist: '0.8 km' },
                  { title: 'Baner waterlogging', sev: 'medium' as const, dist: '2.1 km' },
                ].map(n => (
                  <div key={n.title} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <SeverityBadge severity={n.sev} size="sm" />
                    <span className="text-sm text-gray-300 flex-1 truncate">{n.title}</span>
                    <span className="text-xs text-gray-600">{n.dist}</span>
                  </div>
                ))}
              </div>
              <Link to="/issues" className="mt-3 text-xs text-amber hover:underline flex items-center gap-1">
                View all nearby →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
