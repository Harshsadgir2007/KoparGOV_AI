import React from 'react';
import { IndianRupee, Users, Truck, Wrench, CheckCircle2 } from 'lucide-react';

interface ResourceUtilizationSectionProps {
  data: {
    budget_used: number;
    budget_available: number;
    budget_pct: number;
    workers_pct: number;
    vehicles_pct: number;
    equipment_pct: number;
  };
}

export const ResourceUtilizationSection: React.FC<ResourceUtilizationSectionProps> = ({
  data,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Resource Utilization & Municipal Capacity</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Active operational burn rates across municipal council assets
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          Optimal Load
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Budget */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-700" />
              <span>Budget Burn</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {data.budget_pct}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.budget_pct}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-600 pt-1">
            <span>Used: <strong>₹{data.budget_used.toLocaleString('en-IN')}</strong></span>
            <span>Avail: <strong>₹{data.budget_available.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Workers */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-700" />
              <span>Field Workers</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {data.workers_pct}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.workers_pct}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-600 pt-1">
            <span>Deployment Rate</span>
            <span className="text-indigo-800 font-bold">36 / 45 Active</span>
          </div>
        </div>

        {/* Vehicles */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-700" />
              <span>Fleet Vehicles</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {data.vehicles_pct}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.vehicles_pct}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-600 pt-1">
            <span>Fleet Utilization</span>
            <span className="text-purple-800 font-bold">8 / 12 on Route</span>
          </div>
        </div>

        {/* Equipment */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-700" />
              <span>Heavy Equipment</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {data.equipment_pct}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.equipment_pct}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-600 pt-1">
            <span>Specialized Gear</span>
            <span className="text-amber-800 font-bold">Jetters & Rollers</span>
          </div>
        </div>
      </div>
    </div>
  );
};
