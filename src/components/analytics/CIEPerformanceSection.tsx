import React from 'react';
import { Sparkles, FileCheck, XCircle, Clock, ShieldAlert, Award } from 'lucide-react';

interface CIEPerformanceSectionProps {
  data: {
    recommendations: number;
    approved: number;
    rejected: number;
    pending: number;
    average_priority_score: number;
    critical_resolved: number;
  };
}

export const CIEPerformanceSection: React.FC<CIEPerformanceSectionProps> = ({ data }) => {
  const approvalRate = Math.round((data.approved / data.recommendations) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Civic Intelligence Engine (CIE) Decision Performance</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Algorithmic accuracy, officer alignment rate, and multi-criteria calibration metrics
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {approvalRate}% Officer Approval Rate
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Total Recommendations */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[10px] font-bold uppercase">Evaluated</span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">
            {data.recommendations}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">Total CIE models</p>
        </div>

        {/* Approved */}
        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase">Approved</span>
          </div>
          <p className="text-lg font-black text-emerald-900 font-mono">
            {data.approved}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium">{approvalRate}% Authorized</p>
        </div>

        {/* Pending */}
        <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase">Pending</span>
          </div>
          <p className="text-lg font-black text-amber-900 font-mono">
            {data.pending}
          </p>
          <p className="text-[10px] text-amber-700 font-medium">Awaiting decision</p>
        </div>

        {/* Rejected */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase">Recalibrated</span>
          </div>
          <p className="text-lg font-black text-slate-700 font-mono">
            {data.rejected}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">Officer review note</p>
        </div>

        {/* Average Priority */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[10px] font-bold uppercase">Avg Priority</span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">
            {data.average_priority_score}
          </p>
          <p className="text-[10px] text-purple-700 font-medium">Out of 100 score</p>
        </div>

        {/* Critical Resolved */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[10px] font-bold uppercase">Critical Done</span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">
            {data.critical_resolved}
          </p>
          <p className="text-[10px] text-red-700 font-medium">Zero fatalities</p>
        </div>
      </div>
    </div>
  );
};
