import React from 'react';
import { IndianRupee, Users, Truck, CheckCircle2 } from 'lucide-react';

interface ResourceAvailabilityCardProps {
  resources: {
    budget_available: number;
    budget_required: number;
    budget_remaining: number;
    workers_available: number;
    workers_required: number;
    workers_remaining: number;
    vehicles_available: number;
    vehicles_required: number;
    vehicles_remaining: number;
  };
}

export const ResourceAvailabilityCard: React.FC<ResourceAvailabilityCardProps> = ({
  resources,
}) => {
  const budgetPct = Math.min(
    100,
    Math.round((resources.budget_required / resources.budget_available) * 100)
  );
  const workersPct = Math.min(
    100,
    Math.round((resources.workers_required / resources.workers_available) * 100)
  );
  const vehiclesPct = Math.min(
    100,
    Math.round((resources.vehicles_required / resources.vehicles_available) * 100)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Resource Availability
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Pre-flight allocation feasibility check for Kopargaon municipality
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Feasible</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Budget */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-700" />
              <span>Municipal Budget</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">{budgetPct}% Used</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${budgetPct}%` }}
            />
          </div>

          <div className="space-y-1 text-[11px] font-mono pt-1">
            <div className="flex justify-between text-slate-600">
              <span>Available:</span>
              <strong className="text-slate-900">₹{resources.budget_available.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between text-red-700">
              <span>Required:</span>
              <strong className="text-red-700">₹{resources.budget_required.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between text-emerald-800 pt-1 border-t border-slate-200">
              <span>Remaining:</span>
              <strong className="text-emerald-800 font-bold">₹{resources.budget_remaining.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-700" />
              <span>Staff / Workers</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">{workersPct}% Used</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${workersPct}%` }}
            />
          </div>

          <div className="space-y-1 text-[11px] font-mono pt-1">
            <div className="flex justify-between text-slate-600">
              <span>Available:</span>
              <strong className="text-slate-900">{resources.workers_available} Personnel</strong>
            </div>
            <div className="flex justify-between text-indigo-700">
              <span>Required:</span>
              <strong className="text-indigo-700">{resources.workers_required} Personnel</strong>
            </div>
            <div className="flex justify-between text-emerald-800 pt-1 border-t border-slate-200">
              <span>Remaining:</span>
              <strong className="text-emerald-800 font-bold">{resources.workers_remaining} Personnel</strong>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-sky-700" />
              <span>Fleet Vehicles</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">{vehiclesPct}% Used</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${vehiclesPct}%` }}
            />
          </div>

          <div className="space-y-1 text-[11px] font-mono pt-1">
            <div className="flex justify-between text-slate-600">
              <span>Available:</span>
              <strong className="text-slate-900">{resources.vehicles_available} Units</strong>
            </div>
            <div className="flex justify-between text-sky-700">
              <span>Required:</span>
              <strong className="text-sky-700">{resources.vehicles_required} Unit</strong>
            </div>
            <div className="flex justify-between text-emerald-800 pt-1 border-t border-slate-200">
              <span>Remaining:</span>
              <strong className="text-emerald-800 font-bold">{resources.vehicles_remaining} Units</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
