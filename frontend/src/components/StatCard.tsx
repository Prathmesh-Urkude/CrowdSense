import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  delta?: string;
  deltaUp?: boolean;
  accent?: 'amber' | 'cyan' | 'green' | 'red' | 'purple';
  suffix?: string;
  animate?: boolean;
}

const ACCENT_CONFIG = {
  amber:  { icon: 'bg-amber/10 text-amber border-amber/20',   glow: 'hover:shadow-amber',  bar: 'bg-amber' },
  cyan:   { icon: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', glow: 'hover:shadow-cyan', bar: 'bg-cyan-400' },
  green:  { icon: 'bg-green-500/10 text-green-400 border-green-500/20', glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]', bar: 'bg-green-400' },
  red:    { icon: 'bg-red-500/10 text-red-400 border-red-500/20', glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]', bar: 'bg-red-400' },
  purple: { icon: 'bg-purple-500/10 text-purple-400 border-purple-500/20', glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]', bar: 'bg-purple-400' },
};

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, icon: Icon,
  delta, deltaUp = true,
  accent = 'amber', suffix = '', animate = true,
}) => {
  const cfg = ACCENT_CONFIG[accent];
  const numValue = typeof value === 'number' ? value : 0;
  const animatedValue = animate ? useCountUp(numValue) : numValue;
  const displayValue = typeof value === 'string' ? value : `${animatedValue.toLocaleString()}${suffix}`;

  return (
    <div className={clsx(
      'cs-card p-5 transition-all duration-300 group cursor-default',
      cfg.glow
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-2.5 rounded-xl border transition-transform group-hover:scale-110', cfg.icon)}>
          <Icon size={20} />
        </div>
        {delta && (
          <span className={clsx(
            'text-xs font-display font-semibold px-2 py-1 rounded-full border uppercase tracking-wider',
            deltaUp
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          )}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>

      <div className="mb-1">
        <span className="font-display font-bold text-3xl text-white tracking-tight">
          {displayValue}
        </span>
      </div>
      <p className="text-sm text-gray-400 font-body">{label}</p>

      {/* Bottom accent bar */}
      <div className="mt-4 h-0.5 bg-bg-elevated rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full w-0 group-hover:w-full transition-all duration-700', cfg.bar)} />
      </div>
    </div>
  );
};

export default StatCard;
