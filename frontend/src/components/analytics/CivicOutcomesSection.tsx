import React from 'react';
import { ShieldCheck, Clock, Users, IndianRupee, Activity, CheckCircle2 } from 'lucide-react';

interface CivicOutcomesSectionProps {
  outcomes: {
    critical_resolved_ratio: string;
    average_response_hours: number;
    population_benefited: number;
    budget_utilization_pct: number;
    resource_utilization_pct: number;
  };
}

export const CivicOutcomesSection: React.FC<CivicOutcomesSectionProps> = ({
  outcomes,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Civic Outcome Metrics & Public Benefit</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Measurable citizen benefits achieved through resource-aware prioritization
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Impact Verified
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {/* Critical Resolved */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[10px] font-bold uppercase">Critical Resolved</span>
          </div>
          <p className="text-base font-black text-slate-900 font-mono">
            {outcomes.critical_resolved_ratio}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold">83% Hazard closure</p>
        </div>

        {/* Avg Response Time */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase">Avg Response Time</span>
          </div>
          <p className="text-base font-black text-slate-900 font-mono">
            {outcomes.average_response_hours} hrs
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold">-52% vs FCFS queue</p>
        </div>

        {/* Population Benefited */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold uppercase">Population Benefited</span>
          </div>
          <p className="text-base font-black text-slate-900 font-mono">
            {outcomes.population_benefited.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-indigo-700 font-semibold">Direct radius reach</p>
        </div>

        {/* Budget Utilization */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase">Budget Utilization</span>
          </div>
          <p className="text-base font-black text-slate-900 font-mono">
            {outcomes.budget_utilization_pct}%
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold">Within fiscal cap</p>
        </div>

        {/* Resource Utilization */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[10px] font-bold uppercase">Resource Utilization</span>
          </div>
          <p className="text-base font-black text-slate-900 font-mono">
            {outcomes.resource_utilization_pct}%
          </p>
          <p className="text-[10px] text-purple-700 font-semibold">Balanced shift load</p>
        </div>
      </div>
    </div>
  );
};
