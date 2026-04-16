import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid3X3, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import IssueCard from '../components/IssueCard';
import { SeverityBadge } from '../components/SeverityBadge';
import type { Issue, SeverityLevel, IssueStatus, IssueCategory, BackendReport } from '../types';
import { reportsAPI } from '../utils/api';
import clsx from 'clsx';

// ─── Hardcoded mock issues (always visible) ───────────────────────────────────
const MOCK_ISSUES: Issue[] = [
  { id: 'i001', title: 'Large pothole on MG Road near bus stop 14', description: 'Deep pothole, vehicle damage reported. Multiple commuters affected.', category: 'pothole', status: 'open', severity: 'critical', priorityScore: 92, location: { address: 'MG Road, Bus Stop 14', city: 'Pune', coordinates: { lat: 18.5204, lng: 73.8567 } }, images: [], aiAnalysis: { severity: 'critical', severityScore: 89, priorityScore: 92, confidence: 0.94, damageType: 'Pothole', estimatedArea: 2.4, repairEstimate: '₹18,000–₹25,000', urgencyReason: 'High traffic', detectedFeatures: ['Deep pothole'], boundingBoxes: [] }, reportedBy: { id: 'u1', name: 'Anonymous Citizen' }, upvotes: 47, comments: [], createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i002', title: 'Road crack spreading — FC Road Shivajinagar', description: 'Long crack developing across the full width of the road.', category: 'crack', status: 'in_progress', severity: 'high', priorityScore: 74, location: { address: 'FC Road, Shivajinagar', city: 'Pune', coordinates: { lat: 18.53, lng: 73.845 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 72, priorityScore: 74, confidence: 0.88, damageType: 'Crack', estimatedArea: 5.1, repairEstimate: '₹8,000–₹12,000', urgencyReason: 'Spreading', detectedFeatures: ['Cracking'], boundingBoxes: [] }, reportedBy: { id: 'u2', name: 'Anonymous Citizen' }, upvotes: 23, comments: [], createdAt: new Date(Date.now() - 8 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i003', title: 'Waterlogging Baner Road near Balewadi', description: 'Severe waterlogging after rain. Road unusable for 2–3 hours.', category: 'waterlogging', status: 'open', severity: 'medium', priorityScore: 58, location: { address: 'Baner Road, Balewadi', city: 'Pune', coordinates: { lat: 18.559, lng: 73.787 } }, images: [], aiAnalysis: { severity: 'medium', severityScore: 55, priorityScore: 58, confidence: 0.82, damageType: 'Waterlogging', estimatedArea: 15, repairEstimate: '₹30,000–₹50,000', urgencyReason: 'Drainage failure', detectedFeatures: ['Standing water'], boundingBoxes: [] }, reportedBy: { id: 'u3', name: 'Anonymous Citizen' }, upvotes: 12, comments: [], createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i004', title: 'Damaged footpath — Deccan Gymkhana', description: 'Footpath tiles broken and uplifted, hazard for pedestrians.', category: 'damaged_footpath', status: 'resolved', severity: 'low', priorityScore: 35, location: { address: 'Deccan Gymkhana', city: 'Pune', coordinates: { lat: 18.5167, lng: 73.837 } }, images: [], aiAnalysis: { severity: 'low', severityScore: 30, priorityScore: 35, confidence: 0.91, damageType: 'Footpath', estimatedArea: 3.2, repairEstimate: '₹5,000–₹8,000', urgencyReason: 'Pedestrian safety', detectedFeatures: ['Lifted tiles'], boundingBoxes: [] }, reportedBy: { id: 'u4', name: 'Anonymous Citizen' }, upvotes: 8, comments: [], createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: new Date().toISOString() },
  { id: 'i005', title: 'Broken divider — Pune-Mumbai Highway', description: 'Road divider damaged, creating a safety hazard at Km 14.', category: 'broken_divider', status: 'open', severity: 'high', priorityScore: 81, location: { address: 'Pune-Mumbai Hwy, Km 14', city: 'Pune', coordinates: { lat: 18.6298, lng: 73.7997 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 78, priorityScore: 81, confidence: 0.9, damageType: 'Divider', estimatedArea: 8, repairEstimate: '₹20,000–₹35,000', urgencyReason: 'Highway safety', detectedFeatures: ['Broken concrete'], boundingBoxes: [] }, reportedBy: { id: 'u5', name: 'Anonymous Citizen' }, upvotes: 31, comments: [], createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i006', title: 'Pothole cluster — Kothrud Market Road', description: 'Multiple potholes in a 50m stretch outside the market.', category: 'pothole', status: 'open', severity: 'critical', priorityScore: 88, location: { address: 'Kothrud Market Road', city: 'Pune', coordinates: { lat: 18.5062, lng: 73.8074 } }, images: [], aiAnalysis: { severity: 'critical', severityScore: 85, priorityScore: 88, confidence: 0.96, damageType: 'Multiple Potholes', estimatedArea: 7.5, repairEstimate: '₹40,000–₹60,000', urgencyReason: 'Cluster risk', detectedFeatures: ['Cluster damage'], boundingBoxes: [] }, reportedBy: { id: 'u6', name: 'Anonymous Citizen' }, upvotes: 55, comments: [], createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i007', title: 'Crack on Aundh Road near D-Mart', description: 'Alligator cracking on the main road surface.', category: 'crack', status: 'open', severity: 'medium', priorityScore: 62, location: { address: 'Aundh Road, near D-Mart', city: 'Pune', coordinates: { lat: 18.5584, lng: 73.8076 } }, images: [], aiAnalysis: { severity: 'medium', severityScore: 60, priorityScore: 62, confidence: 0.85, damageType: 'Alligator Crack', estimatedArea: 4.0, repairEstimate: '₹10,000–₹18,000', urgencyReason: 'Spreading pattern', detectedFeatures: ['Surface fracture'], boundingBoxes: [] }, reportedBy: { id: 'u7', name: 'Anonymous Citizen' }, upvotes: 19, comments: [], createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i008', title: 'Waterlogging at Viman Nagar underpass', description: 'Underpass floods heavily during rain, vehicles get stuck.', category: 'waterlogging', status: 'in_progress', severity: 'high', priorityScore: 77, location: { address: 'Viman Nagar Underpass', city: 'Pune', coordinates: { lat: 18.5679, lng: 73.9143 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 75, priorityScore: 77, confidence: 0.87, damageType: 'Flood Zone', estimatedArea: 20, repairEstimate: '₹50,000–₹80,000', urgencyReason: 'Complete blockage', detectedFeatures: ['Standing water', 'Drainage blocked'], boundingBoxes: [] }, reportedBy: { id: 'u8', name: 'Anonymous Citizen' }, upvotes: 34, comments: [], createdAt: new Date(Date.now() - 10 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
];

// ─── Convert BackendReport → Issue shape for IssueCard ────────────────────────
function severityFromScore(score: number): SeverityLevel {
  return score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
}

function backendToIssue(r: BackendReport): Issue {
  const sev = severityFromScore(r.severity_score);
  const cat = (r.category ?? 'other') as IssueCategory;
  return {
    id: r.id,
    title: `${cat.replace('_', ' ')} Report`.replace(/^\w/, c => c.toUpperCase()),
    description: r.description ?? '',
    category: cat,
    status: (r.status ?? 'pending') as IssueStatus,
    severity: sev,
    priorityScore: Math.round(r.priority_score),
    location: { address: 'View on map', city: 'Reported location', coordinates: { lat: 0, lng: 0 } },
    images: r.image_url ? [`http://localhost:5000${r.image_url}`] : [],
    aiAnalysis: {
      severity: sev, severityScore: Math.round(r.severity_score),
      priorityScore: Math.round(r.priority_score), confidence: 0.9,
      damageType: cat.replace('_', ' '), estimatedArea: 0,
      repairEstimate: '—', urgencyReason: '—', detectedFeatures: [], boundingBoxes: [],
    },
    reportedBy: { id: r.created_by, name: 'Anonymous Citizen' },
    upvotes: r.upvote_count ?? 0,
    comments: [],
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? r.created_at,
  };
}

// ─── Filter constants ─────────────────────────────────────────────────────────
const SEVERITIES: SeverityLevel[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: IssueStatus[] = ['pending', 'open', 'in_progress', 'resolved', 'closed'];
const SORT_OPTIONS = [
  { value: 'priorityScore', label: 'Priority Score' },
  { value: 'createdAt',     label: 'Newest First' },
  { value: 'upvotes',       label: 'Most Upvoted' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const IssuesList: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | ''>('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [sortBy, setSortBy] = useState('priorityScore');
  const [showFilters, setShowFilters] = useState(false);

  const [backendIssues, setBackendIssues] = useState<Issue[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(true);

  // Fetch real reports and convert to Issue shape
  useEffect(() => {
    reportsAPI.getAll()
      .then(res => {
        const rows: BackendReport[] = Array.isArray(res.data) ? res.data : [];
        setBackendIssues(rows.map(backendToIssue));
      })
      .catch(() => setBackendIssues([]))
      .finally(() => setLoadingBackend(false));
  }, []);

  // Merge: backend reports first, then mock issues whose id is not already from backend
  const backendIds = new Set(backendIssues.map(i => i.id));
  const mockOnly = MOCK_ISSUES.filter(m => !backendIds.has(m.id));
  const ALL_ISSUES: Issue[] = [...backendIssues, ...mockOnly];

  // ── Filters & sort ──────────────────────────────────────────────────────────
  const filtered = ALL_ISSUES
    .filter(i => !filterSeverity || i.severity === filterSeverity)
    .filter(i => !filterStatus  || i.status   === filterStatus)
    .filter(i =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.location.address.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'priorityScore') return b.priorityScore - a.priorityScore;
      if (sortBy === 'createdAt')     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'upvotes')       return b.upvotes - a.upvotes;
      return 0;
    });

  const clearFilters = () => { setFilterSeverity(''); setFilterStatus(''); setSearch(''); };
  const hasFilters = filterSeverity || filterStatus || search;

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-4xl font-black text-white uppercase tracking-wide">All Issues</h1>
          <p className="text-gray-400 text-sm mt-1">
            {loadingBackend ? 'Loading…' : `${filtered.length} issue${filtered.length !== 1 ? 's' : ''} found`}
            {!loadingBackend && hasFilters && ` (filtered from ${ALL_ISSUES.length})`}
            {!loadingBackend && backendIssues.length > 0 && (
              <span className="ml-2 text-xs text-amber">
                · {backendIssues.length} live from database
              </span>
            )}
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, address, category..."
              className="cs-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="cs-input pr-8 pl-3 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(p => !p)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all',
              showFilters || hasFilters
                ? 'bg-amber/10 border-amber/30 text-amber'
                : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
            )}
          >
            <SlidersHorizontal size={15} /> Filters
            {hasFilters && <span className="w-1.5 h-1.5 bg-amber rounded-full" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-amber flex items-center gap-1 transition">
              <X size={12} /> Clear
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded-xl p-1 ml-auto">
            <button onClick={() => setView('grid')} className={clsx('p-2 rounded-lg transition', view === 'grid' ? 'bg-amber text-white' : 'text-gray-500 hover:text-white')}>
              <Grid3X3 size={15} />
            </button>
            <button onClick={() => setView('list')} className={clsx('p-2 rounded-lg transition', view === 'list' ? 'bg-amber text-white' : 'text-gray-500 hover:text-white')}>
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="cs-card p-4 mb-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-display uppercase tracking-widest text-gray-400 mb-2.5">Severity</p>
                <div className="flex flex-wrap gap-2">
                  {SEVERITIES.map(s => (
                    <button key={s} onClick={() => setFilterSeverity(filterSeverity === s ? '' : s)}
                      className={clsx('transition', filterSeverity === s ? 'opacity-100' : 'opacity-50 hover:opacity-80')}>
                      <SeverityBadge severity={s} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-display uppercase tracking-widest text-gray-400 mb-2.5">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-display uppercase tracking-wider border transition',
                        filterStatus === s ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-bg-elevated border-border text-gray-400'
                      )}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Issues grid / list */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Filter size={40} className="text-gray-700 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-gray-500 mb-2">No Issues Found</h3>
            <p className="text-gray-600 text-sm">Try adjusting your filters or search query.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 btn-secondary px-6 py-2 rounded-lg text-sm">Clear Filters</button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} view="grid" index={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} view="list" index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuesList;
