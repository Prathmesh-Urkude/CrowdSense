import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ThumbsUp, MessageCircle, Clock, ChevronRight } from 'lucide-react';
import { SeverityBadge, StatusBadge, PriorityRing } from './SeverityBadge';
import type { Issue } from '../types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { upvoteAPI } from '../utils/api';

interface IssueCardProps {
  issue: Issue;
  view?: 'grid' | 'list';
  index?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  pothole: 'Pothole',
  crack: 'Road Crack',
  waterlogging: 'Waterlogging',
  broken_divider: 'Broken Divider',
  damaged_footpath: 'Damaged Footpath',
  other: 'Other',
};

const IssueCard: React.FC<IssueCardProps> = ({ issue, view = 'grid', index = 0 }) => {
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(issue.upvotes);
  const [upvoting, setUpvoting] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (upvoting) return;
    setUpvoting(true);
    try {
      const res = await upvoteAPI.toggle(issue.id);
      setUpvoted(res.data?.hasUpvoted ?? !upvoted);
      setUpvoteCount(res.data?.upvotes ?? upvoteCount);
    } catch {
      // optimistic update on error
      setUpvoted(v => !v);
      setUpvoteCount(c => upvoted ? c - 1 : c + 1);
    } finally {
      setUpvoting(false);
    }
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link to={`/issues/${issue.id}`}>
          <div className={clsx(
            'cs-card hover-lift flex items-center gap-4 p-4 border-l-4',
            `border-severity-${issue.severity}`
          )}>
            {/* Image */}
            <div className="w-16 h-16 rounded-lg bg-bg-elevated flex-shrink-0 overflow-hidden">
              {issue.images?.[0] ? (
                <img src={issue.images[0]} alt="issue" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-display">
                  NO IMG
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <SeverityBadge severity={issue.severity} size="sm" />
                <StatusBadge status={issue.status} size="sm" />
                <span className="text-xs text-gray-500 font-mono">#{issue.id.slice(-6)}</span>
              </div>
              <h3 className="font-display text-base font-semibold text-white truncate">{issue.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} />
                <span className="truncate">{issue.location.address}</span>
              </div>
            </div>

            {/* Priority */}
            <div className="hidden sm:block flex-shrink-0">
              <PriorityRing score={issue.priorityScore} size={52} />
            </div>

            {/* Stats */}
            <div className="hidden md:flex flex-col gap-1 items-end flex-shrink-0">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <button
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className={clsx(
                    'flex items-center gap-1 transition-colors',
                    upvoted ? 'text-accent-blue' : 'text-gray-500 hover:text-accent-blue'
                  )}
                >
                  <ThumbsUp size={11} className={upvoted ? 'fill-current' : ''} />
                  {upvoteCount}
                </button>
                <span className="flex items-center gap-1"><MessageCircle size={11} />{issue.comments.length}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-gray-600"><Clock size={11} />{timeAgo}</span>
            </div>

            <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link to={`/issues/${issue.id}`}>
        <div className={clsx(
          'cs-card hover-lift overflow-hidden border-l-4 h-full flex flex-col',
          `border-severity-${issue.severity}`
        )}>
          {/* Image */}
          <div className="relative h-40 bg-bg-elevated overflow-hidden scan-container">
            {issue.images?.[0] ? (
              <img src={issue.images[0]} alt="issue" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-2">
                    <MapPin size={20} className="text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-display uppercase tracking-widest">No Image</p>
                </div>
              </div>
            )}
            {/* Overlay badges */}
            <div className="absolute top-2 left-2 flex gap-1.5">
              <SeverityBadge severity={issue.severity} size="sm" />
            </div>
            <div className="absolute top-2 right-2">
              <PriorityRing score={issue.priorityScore} size={44} />
            </div>
            {/* Category tag */}
            <div className="absolute bottom-2 left-2">
              <span className="px-2 py-0.5 bg-bg-primary/80 backdrop-blur text-xs font-display uppercase tracking-widest text-gray-400 rounded border border-border/50">
                {CATEGORY_LABELS[issue.category]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={issue.status} size="sm" />
              <span className="text-xs text-gray-600 font-mono ml-auto">#{issue.id.slice(-6)}</span>
            </div>

            <h3 className="font-display text-lg font-bold text-white mb-1 leading-tight line-clamp-2">
              {issue.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 flex-1 leading-relaxed">{issue.description}</p>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={11} />
                <span className="truncate max-w-[120px]">{issue.location.ward}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <button
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className={clsx(
                    'flex items-center gap-1 transition-colors',
                    upvoted ? 'text-accent-blue' : 'text-gray-500 hover:text-accent-blue'
                  )}
                >
                  <ThumbsUp size={11} className={upvoted ? 'fill-current' : ''} />
                  {upvoteCount}
                </button>
                <span className="flex items-center gap-1"><MessageCircle size={11} />{issue.comments.length}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
              <Clock size={10} />{timeAgo}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default IssueCard;
