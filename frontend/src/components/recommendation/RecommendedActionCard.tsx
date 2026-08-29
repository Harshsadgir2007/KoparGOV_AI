import React from 'react';
import { Truck, Users, IndianRupee, Clock, Sparkles } from 'lucide-react';

interface RecommendedActionCardProps {
  headline: string;
  vehicle: string;
  workers: number;
  estimatedCost: number;
  estimatedTime: string;
}

export const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({
  headline,
  vehicle,
  workers,
  estimatedCost,
  estimatedTime,
}) => {
  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-sky-50/50 rounded-xl border-2 border-sky-300 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Badge & Title */}
      <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-sky-600 text-white shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-wider text-sky-950">
            Recommended Action
          </h2>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
          CIE Optimized
        </span>
      </div>

      {/* Main Headline */}
      <div>
        <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
          {headline}
        </h3>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Resource-aware allocation calculated for immediate hazard containment
        </p>
      </div>

      {/* 4 Key Requirement Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Machinery */}
        <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Truck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Fleet Unit</span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate" title={vehicle}>
            {vehicle}
          </p>
        </div>

        {/* Workers */}
        <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Personnel</span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            {workers} Field Workers
          </p>
        </div>

        {/* Estimated Cost */}
        <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cost</span>
          </div>
          <p className="text-xs font-bold text-slate-900 font-mono">
            ₹{estimatedCost.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Estimated Time */}
        <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Est. Duration</span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            {estimatedTime}
          </p>
        </div>
      </div>
    </div>
  );
};
