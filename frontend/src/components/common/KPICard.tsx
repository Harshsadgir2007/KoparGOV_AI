import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'info' | 'success' | 'neutral' | 'purple';
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
  iconColor = 'text-sky-700',
  iconBg = 'bg-sky-50',
  onClick,
}) => {
  const badgeStyles = {
    danger: 'bg-red-50 text-red-700 border-red-200/80',
    warning: 'bg-orange-50 text-orange-700 border-orange-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeType];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`group relative w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 text-left flex flex-col justify-between ${
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500' : ''
      }`}
    >
      {/* Top row: Title + Icon Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans truncate">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
        >
          <Icon className="w-4.5 h-4.5 stroke-[2.2]" aria-hidden="true" />
        </div>
      </div>

      {/* Middle & Bottom row: Big Value + Badge + Subtitle */}
      <div className="mt-3 space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {typeof value === 'number' && value < 10 && value >= 0 ? `0${value}` : value}
          </span>
          {badge && (
            <span
              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles}`}
            >
              {badge}
            </span>
          )}
        </div>

        {subValue && (
          <p className="text-xs text-slate-500 font-medium leading-relaxed truncate">
            {subValue}
          </p>
        )}
      </div>
    </Component>
  );
};
