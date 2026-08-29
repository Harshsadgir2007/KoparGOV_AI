import React from 'react';
import { CivicPriorityLevel } from '../../types';
import { AlertOctagon, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface PriorityBadgeProps {
  level: CivicPriorityLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = 'md',
}) => {
  const config = {
    CRITICAL: {
      bg: 'bg-red-50 text-red-700 border-red-200 ring-red-600/10',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />,
      dot: 'bg-red-600',
      label: 'CRITICAL',
    },
    HIGH: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" aria-hidden="true" />,
      dot: 'bg-orange-500',
      label: 'HIGH',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />,
      dot: 'bg-amber-500',
      label: 'MEDIUM',
    },
    LOW: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-600/10',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />,
      dot: 'bg-emerald-500',
      label: 'LOW',
    },
  }[level] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/10',
    icon: null,
    dot: 'bg-slate-400',
    label: level,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-bold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ring-1 ring-inset ${config.bg} ${sizeClasses}`}
      aria-label={`Priority: ${config.label}${score !== undefined ? `, Score: ${score}/100` : ''}`}
    >
      {showIcon ? config.icon : <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-75 font-mono ml-0.5">({score}/100)</span>
      )}
    </span>
  );
};
