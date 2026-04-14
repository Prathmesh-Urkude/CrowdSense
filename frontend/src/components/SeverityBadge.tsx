import React from 'react';
import type { SeverityLevel, IssueStatus } from '../types';
import clsx from 'clsx';

// ─── Severity Badge ──────────────────────────────────────────────────────────
interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const SEVERITY_CONFIG = {
  low:      { label: 'Low',      bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30',  dot: 'bg-green-400'  },
  medium:   { label: 'Medium',   bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30',  dot: 'bg-amber-400'  },
  high:     { label: 'High',     bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  critical: { label: 'Critical', bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30',    dot: 'bg-red-400 animate-pulse'    },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md', showIcon = true }) => {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border font-display uppercase tracking-widest',
      cfg.bg, cfg.text, cfg.border,
      size === 'sm'  && 'px-2 py-0.5 text-xs',
      size === 'md'  && 'px-3 py-1 text-xs',
      size === 'lg'  && 'px-4 py-1.5 text-sm',
    )}>
      {showIcon && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />}
      {cfg.label}
    </span>
  );
};

// ─── Status Badge ────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG = {
  open:        { label: 'Open',        cls: 'status-open'        },
  in_progress: { label: 'In Progress', cls: 'status-in_progress' },
  resolved:    { label: 'Resolved',    cls: 'status-resolved'    },
  closed:      { label: 'Closed',      cls: 'status-closed'      },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full font-display uppercase tracking-widest',
      cfg.cls,
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-3 py-1 text-xs',
    )}>
      {cfg.label}
    </span>
  );
};

// ─── Priority Score Ring ─────────────────────────────────────────────────────
interface PriorityRingProps {
  score: number;  // 0-100
  size?: number;
}

export const PriorityRing: React.FC<PriorityRingProps> = ({ score, size = 64 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#EF4444' : score >= 60 ? '#F97316' : score >= 40 ? '#F59E0B' : '#22C55E';

  return (
    <div className="priority-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-white" style={{ fontSize: size * 0.22 }}>{score}</span>
        <span className="text-gray-500" style={{ fontSize: size * 0.13, lineHeight: 1 }}>PRIORITY</span>
      </div>
    </div>
  );
};

// ─── Severity Score Bar ──────────────────────────────────────────────────────
interface SeverityBarProps {
  score: number; // 0-100
  label?: string;
}

export const SeverityBar: React.FC<SeverityBarProps> = ({ score, label }) => {
  const color = score >= 80 ? '#EF4444' : score >= 60 ? '#F97316' : score >= 40 ? '#F59E0B' : '#22C55E';
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs font-mono font-medium" style={{ color }}>{score}/100</span>
        </div>
      )}
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
    </div>
  );
};
