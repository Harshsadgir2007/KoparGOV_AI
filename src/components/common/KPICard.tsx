import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subValue,
  badge,
  badgeType = 'neutral',
  icon: Icon,
  iconColor = 'text-slate-700',
  iconBg = 'bg-slate-100',
  onClick,
}) => {
  const badgeColors = {
    danger: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    info: 'bg-sky-100 text-sky-800 border-sky-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeType];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`w-full bg-white rounded-lg border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300 text-left ${
        onClick ? 'cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
            {badge && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${badgeColors}`}>
                {badge}
              </span>
            )}
          </div>
          {subValue && <p className="text-xs text-slate-700 mt-1 font-medium">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBg} ${iconColor} shrink-0 ml-3`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </Component>
  );
};
