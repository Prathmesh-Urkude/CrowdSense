import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MapPin, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { reportsAPI } from '../utils/api';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import type { BackendReport, IssueStatus, SeverityLevel } from '../types';

const severityFromScore = (s: number): SeverityLevel =>
  s >= 80 ? 'critical' : s >= 60 ? 'high' : s >= 40 ? 'medium' : 'low';

const STATUS_VALUES: IssueStatus[] = [
  'pending','reported','under-review','assigned','open','in_progress','resolved','closed','rejected',
];
const toStatus = (s?: string): IssueStatus =>
  (STATUS_VALUES.includes(s as IssueStatus) ? s : 'reported') as IssueStatus;

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<BackendReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsAPI.getUserReports()
      .then(res => setReports(res.data as BackendReport[]))
      .catch(err => setError(err?.response?.data?.error ?? 'Failed to load your reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-10 h-10 border-2 mx-auto mb-4" />
        <p className="text-gray-500 font-display uppercase tracking-widest text-xs">Loading reports...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="cs-card p-8 text-center max-w-sm">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-300 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <FileText size={22} className="text-amber" />
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
              My Reports
            </h1>
          </div>
          <p className="text-gray-400 text-sm ml-9">
            {reports.length} report{reports.length !== 1 ? 's' : ''} submitted by you
          </p>
        </motion.div>

        {/* Empty state */}
        {reports.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="cs-card p-12 text-center"
          >
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold text-gray-300 mb-2 uppercase tracking-wide">
              No reports yet
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              You haven't submitted any reports. Help improve your city!
            </p>
            <Link to="/report" className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block">
              Report an Issue
            </Link>
          </motion.div>
        )}

        {/* Report list */}
        <div className="space-y-3">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/issues/${report.id}`}
                className="cs-card p-5 flex gap-4 items-start hover:border-amber/30 transition-colors group block"
              >
                {/* Thumbnail */}
                {report.image_url ? (
                  <img
                    src={report.image_url}
                    alt="report"
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/5"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <FileText size={24} className="text-gray-600" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
                      {report.description || 'No description provided'}
                    </p>
                    <ChevronRight
                      size={16}
                      className="text-gray-600 group-hover:text-amber transition-colors flex-shrink-0 mt-0.5"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <SeverityBadge severity={severityFromScore(report.severity_score)} size="sm" />
                    <StatusBadge status={toStatus(report.status)} />
                    <span className="text-xs text-gray-500 capitalize bg-white/5 px-2 py-0.5 rounded-full">
                      {report.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {report.lat != null && report.lng != null && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </span>
                    {report.upvote_count != null && (
                      <span className="text-gray-500">
                        {report.upvote_count} upvote{report.upvote_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MyReports;
