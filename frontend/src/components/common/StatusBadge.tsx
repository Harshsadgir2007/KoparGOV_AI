import React from 'react';
import { CivicStatus } from '../../types';
import { FileText, CheckCheck, Sparkles, UserCheck, Truck, Clock, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: CivicStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    REPORTED: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: <FileText className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />,
      label: 'REPORTED',
    },
    VALIDATED: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <CheckCheck className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />,
      label: 'VALIDATED',
    },
    PRIORITIZED: {
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />,
      label: 'CIE PRIORITIZED',
    },
    APPROVED: {
      bg: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />,
      label: 'OFFICER APPROVED',
    },
    ASSIGNED: {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: <Truck className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />,
      label: 'TEAM ASSIGNED',
    },
    IN_PROGRESS: {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" aria-hidden="true" />,
      label: 'IN PROGRESS',
    },
    RESOLVED: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />,
      label: 'RESOLVED & VERIFIED',
    },
  }[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: null,
    label: status,
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${sizeClasses}`}
      aria-label={`Status: ${config.label}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
