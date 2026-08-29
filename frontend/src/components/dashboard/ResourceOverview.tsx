import React from 'react';
import { MunicipalResources } from '../../types';
import { IndianRupee, Users, Truck, Wrench } from 'lucide-react';

interface ResourceOverviewProps {
  resources: MunicipalResources | null;
}

export const ResourceOverview: React.FC<ResourceOverviewProps> = ({ resources }) => {
  if (!resources) return null;

  const budgetPct = Math.round((resources.available_budget / resources.total_budget) * 100);
  const workersPct = Math.round((resources.available_workers / resources.total_workers) * 100);
  const vehiclesPct = Math.round((resources.available_vehicles / resources.total_vehicles) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-sky-600" />
            <span>Active Municipal Resource Pool</span>
          </h2>
          <p className="text-xs text-slate-700 mt-0.5 font-medium">
            Live operational assets allocated across all 10 Kopargaon wards
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Sync</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Available Budget */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-sky-100 text-sky-700">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Daily Ward Budget</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900">{budgetPct}% Avail</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">
                ₹{resources.available_budget.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-700 font-medium">
                of ₹{resources.total_budget.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  budgetPct < 25 ? 'bg-red-600' : budgetPct < 50 ? 'bg-amber-500' : 'bg-sky-600'
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Field Personnel */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-indigo-100 text-indigo-700">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Field Workers</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900">{workersPct}% Avail</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">
                {resources.available_workers} Active
              </span>
              <span className="text-xs text-slate-700 font-medium">
                of {resources.total_workers} staff
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  workersPct < 20 ? 'bg-red-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${workersPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fleet Vehicles */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-amber-100 text-amber-800">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Fleet Vehicles</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900">{vehiclesPct}% Avail</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">
                {resources.available_vehicles} Vehicles
              </span>
              <span className="text-xs text-slate-700 font-medium">
                of {resources.total_vehicles} total
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  vehiclesPct < 20 ? 'bg-red-600' : 'bg-amber-600'
                }`}
                style={{ width: `${vehiclesPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Status Mini-Badges */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Heavy Machinery:</span>
        {resources.equipment_status.map((eq) => (
          <span
            key={eq.name}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200"
          >
            <span className="font-medium">{eq.name}:</span>
            <span className="font-bold text-sky-700 font-mono">
              {eq.available}/{eq.total}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};
