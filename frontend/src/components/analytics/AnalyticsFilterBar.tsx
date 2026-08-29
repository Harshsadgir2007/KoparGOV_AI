import React from 'react';
import { Filter, Calendar, RotateCcw, Search, Download } from 'lucide-react';
import { AnalyticsFilters } from '../../services/analyticsService';
import { KOPARGAON_WARDS } from '../../data/mockData';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  onFilterChange: (key: keyof AnalyticsFilters, value: string) => void;
  onReset: () => void;
  onExport: () => void;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  onExport,
}) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        {/* Date Range */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Time Horizon</label>
          <select
            value={filters.dateRange || 'LAST_30_DAYS'}
            onChange={e => onFilterChange('dateRange', e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:bg-white"
          >
            <option value="LAST_7_DAYS">Last 7 Days (Velocity)</option>
            <option value="LAST_30_DAYS">Last 30 Days (Current Month)</option>
            <option value="QUARTER">This Quarter (Q3 2026)</option>
            <option value="YEAR">Fiscal Year 2026-27</option>
          </select>
        </div>

        {/* Ward Filter */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Ward Jurisdiction</label>
          <select
            value={filters.ward || 'ALL'}
            onChange={e => onFilterChange('ward', e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:bg-white"
          >
            <option value="ALL">All Kopargaon Wards</option>
            {KOPARGAON_WARDS.map(w => (
              <option key={w.id} value={`Ward ${w.id}`}>
                Ward {w.id} — {w.name.split(' - ')[1] || ''}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Category</label>
          <select
            value={filters.category || 'ALL'}
            onChange={e => onFilterChange('category', e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="Garbage">Garbage</option>
            <option value="Water">Water</option>
            <option value="Drainage">Drainage</option>
            <option value="Road">Road</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Sanitation">Sanitation</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Priority</label>
          <select
            value={filters.priority || 'ALL'}
            onChange={e => onFilterChange('priority', e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Lifecycle Status</label>
          <select
            value={filters.status || 'ALL'}
            onChange={e => onFilterChange('status', e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-end gap-2">
          <button
            onClick={onReset}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onExport}
            className="flex-1 py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
