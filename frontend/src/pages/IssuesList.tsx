import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid3X3, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import IssueCard from '../components/IssueCard';
import { SeverityBadge } from '../components/SeverityBadge';
import type { Issue, SeverityLevel, IssueStatus, IssueCategory, BackendReport } from '../types';
import { reportsAPI } from '../utils/api';
import clsx from 'clsx';

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

  // ── Filters & sort ──────────────────────────────────────────────────────────
  const filtered = backendIssues
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
            {!loadingBackend && hasFilters && ` (filtered from ${backendIssues.length})`}
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
