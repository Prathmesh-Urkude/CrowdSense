import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid3X3, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import IssueCard from '../components/IssueCard';
import { SeverityBadge } from '../components/SeverityBadge';
import type { Issue, SeverityLevel, IssueStatus, IssueCategory } from '../types';
import clsx from 'clsx';

// Mock data — replace with API call in production
const ALL_ISSUES: Issue[] = [
  { id: 'i001', title: 'Large pothole on MG Road near bus stop 14', description: 'Deep pothole, vehicle damage reported.', category: 'pothole', status: 'open', severity: 'critical', priorityScore: 92, location: { address: 'MG Road, Bus Stop 14', ward: 'Ward 14', city: 'Pune', coordinates: { lat: 18.5204, lng: 73.8567 } }, images: [], aiAnalysis: { severity: 'critical', severityScore: 89, priorityScore: 92, confidence: 0.94, damageType: 'Pothole', estimatedArea: 2.4, repairEstimate: '₹18,000–₹25,000', urgencyReason: 'High traffic', detectedFeatures: ['Deep pothole'], boundingBoxes: [] }, reportedBy: { id: 'u1', name: 'Amit S.' }, upvotes: 47, comments: [], createdAt: new Date(Date.now() - 2*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i002', title: 'Road crack spreading — FC Road Shivajinagar', description: 'Long crack developing across width.', category: 'crack', status: 'in_progress', severity: 'high', priorityScore: 74, location: { address: 'FC Road, Shivajinagar', ward: 'Ward 7', city: 'Pune', coordinates: { lat: 18.53, lng: 73.845 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 72, priorityScore: 74, confidence: 0.88, damageType: 'Crack', estimatedArea: 5.1, repairEstimate: '₹8,000–₹12,000', urgencyReason: 'Spreading', detectedFeatures: ['Cracking'], boundingBoxes: [] }, reportedBy: { id: 'u2', name: 'Priya P.' }, upvotes: 23, comments: [], createdAt: new Date(Date.now() - 8*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i003', title: 'Waterlogging Baner Road near Balewadi', description: 'Severe waterlogging during rain.', category: 'waterlogging', status: 'open', severity: 'medium', priorityScore: 58, location: { address: 'Baner Road, Balewadi', ward: 'Ward 3', city: 'Pune', coordinates: { lat: 18.559, lng: 73.787 } }, images: [], aiAnalysis: { severity: 'medium', severityScore: 55, priorityScore: 58, confidence: 0.82, damageType: 'Waterlogging', estimatedArea: 15, repairEstimate: '₹30,000–₹50,000', urgencyReason: 'Drainage', detectedFeatures: ['Standing water'], boundingBoxes: [] }, reportedBy: { id: 'u3', name: 'Rahul D.' }, upvotes: 12, comments: [], createdAt: new Date(Date.now() - 24*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i004', title: 'Damaged footpath Deccan Gymkhana', description: 'Footpath tiles broken and uplifted.', category: 'damaged_footpath', status: 'resolved', severity: 'low', priorityScore: 35, location: { address: 'Deccan Gymkhana', ward: 'Ward 11', city: 'Pune', coordinates: { lat: 18.5167, lng: 73.837 } }, images: [], aiAnalysis: { severity: 'low', severityScore: 30, priorityScore: 35, confidence: 0.91, damageType: 'Footpath', estimatedArea: 3.2, repairEstimate: '₹5,000–₹8,000', urgencyReason: 'Pedestrian safety', detectedFeatures: ['Lifted tiles'], boundingBoxes: [] }, reportedBy: { id: 'u4', name: 'Sneha K.' }, upvotes: 8, comments: [], createdAt: new Date(Date.now() - 48*3600000).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: new Date().toISOString() },
  { id: 'i005', title: 'Broken divider on Pune-Mumbai Highway', description: 'Road divider broken, safety hazard.', category: 'broken_divider', status: 'open', severity: 'high', priorityScore: 81, location: { address: 'Pune-Mumbai Hwy, Km 14', ward: 'Ward 2', city: 'Pune', coordinates: { lat: 18.6298, lng: 73.7997 } }, images: [], aiAnalysis: { severity: 'high', severityScore: 78, priorityScore: 81, confidence: 0.9, damageType: 'Divider', estimatedArea: 8, repairEstimate: '₹20,000–₹35,000', urgencyReason: 'Highway safety', detectedFeatures: ['Broken concrete'], boundingBoxes: [] }, reportedBy: { id: 'u5', name: 'Vikram M.' }, upvotes: 31, comments: [], createdAt: new Date(Date.now() - 3*3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i006', title: 'Pothole cluster — Kothrud Market', description: 'Multiple potholes in 50m stretch.', category: 'pothole', status: 'open', severity: 'critical', priorityScore: 88, location: { address: 'Kothrud Market Road', ward: 'Ward 9', city: 'Pune', coordinates: { lat: 18.5062, lng: 73.8074 } }, images: [], aiAnalysis: { severity: 'critical', severityScore: 85, priorityScore: 88, confidence: 0.96, damageType: 'Multiple Potholes', estimatedArea: 7.5, repairEstimate: '₹40,000–₹60,000', urgencyReason: 'Multiple high risk', detectedFeatures: ['Cluster damage'], boundingBoxes: [] }, reportedBy: { id: 'u6', name: 'Anita R.' }, upvotes: 55, comments: [], createdAt: new Date(Date.now() - 5*3600000).toISOString(), updatedAt: new Date().toISOString() },
];

const SEVERITIES: SeverityLevel[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const SORT_OPTIONS = [
  { value: 'priorityScore', label: 'Priority Score' },
  { value: 'createdAt', label: 'Newest First' },
  { value: 'upvotes', label: 'Most Upvoted' },
];

const IssuesList: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | ''>('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [sortBy, setSortBy] = useState('priorityScore');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = ALL_ISSUES
    .filter(i => !filterSeverity || i.severity === filterSeverity)
    .filter(i => !filterStatus || i.status === filterStatus)
    .filter(i =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.location.address.toLowerCase().includes(search.toLowerCase()) ||
      i.location.ward.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'priorityScore') return b.priorityScore - a.priorityScore;
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      return 0;
    });

  const clearFilters = () => {
    setFilterSeverity('');
    setFilterStatus('');
    setSearch('');
  };

  const hasFilters = filterSeverity || filterStatus || search;

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-4xl font-black text-white uppercase tracking-wide">All Issues</h1>
          <p className="text-gray-400 text-sm mt-1">
            {filtered.length} issue{filtered.length !== 1 ? 's' : ''} found
            {hasFilters && ` (filtered from ${ALL_ISSUES.length})`}
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, address, ward..."
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
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
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
            <button
              onClick={() => setView('grid')}
              className={clsx('p-2 rounded-lg transition', view === 'grid' ? 'bg-amber text-white' : 'text-gray-500 hover:text-white')}
            ><Grid3X3 size={15} /></button>
            <button
              onClick={() => setView('list')}
              className={clsx('p-2 rounded-lg transition', view === 'list' ? 'bg-amber text-white' : 'text-gray-500 hover:text-white')}
            ><List size={15} /></button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="cs-card p-4 mb-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-display uppercase tracking-widest text-gray-400 mb-2.5">Severity</p>
                <div className="flex flex-wrap gap-2">
                  {SEVERITIES.map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterSeverity(filterSeverity === s ? '' : s)}
                      className={clsx('transition', filterSeverity === s ? 'opacity-100' : 'opacity-50 hover:opacity-80')}
                    >
                      <SeverityBadge severity={s} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-display uppercase tracking-widest text-gray-400 mb-2.5">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-display uppercase tracking-wider border transition',
                        filterStatus === s ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-bg-elevated border-border text-gray-400'
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Issues */}
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
