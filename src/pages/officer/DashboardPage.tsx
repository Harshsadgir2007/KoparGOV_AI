import React from 'react';
import { useCivic } from '../../context/CivicContext';
import { KPICard } from '../../components/common/KPICard';
import { PriorityTable } from '../../components/dashboard/PriorityTable';
import { KopargaonMap } from '../../components/map/KopargaonMap';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { MOCK_KPIS } from '../../mock';
import {
  AlertOctagon,
  AlertTriangle,
  FileCheck2,
  Truck,
  CheckCircle2,
  IndianRupee,
  Users,
  Wrench,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { issues, resources, loading, refreshData } = useCivic();

  if (loading && !resources) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" rows={5} />
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  // Use values from mock / state
  const criticalCount = MOCK_KPIS.critical_issues;
  const highCount = MOCK_KPIS.high_priority;
  const pendingApprovals = MOCK_KPIS.pending_approvals;
  const activeAssignments = MOCK_KPIS.active_assignments;
  const resolvedCount = MOCK_KPIS.resolved;

  const budgetAvailable = resources?.available_budget || MOCK_KPIS.budget_available;
  const workersAvailable = resources?.available_workers || MOCK_KPIS.workers_available;
  const vehiclesAvailable = resources?.available_vehicles || MOCK_KPIS.vehicles_available;

  const budgetPct = MOCK_KPIS.budget_utilization_pct;
  const workersPct = MOCK_KPIS.workers_utilization_pct;
  const vehiclesPct = MOCK_KPIS.vehicles_utilization_pct;

  return (
    <div className="space-y-6">
      {/* Civic Operations Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Civic Operations Overview
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold border border-sky-300">
              KOPARGAON
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
            Municipal Command & Decision-Support • Real-time Civic Intelligence Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Sync Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync</span>
          </button>

          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-2xs transition-colors"
          >
            <span>Review CIE Queue (0{pendingApprovals})</span>
          </Link>
        </div>
      </div>

      {/* 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to="/issues?priority=CRITICAL">
          <KPICard
            title="Critical Issues"
            value={criticalCount < 10 ? `0${criticalCount}` : criticalCount}
            badge="Action Required"
            badgeType="danger"
            subValue="Health & Safety Hazards"
            icon={AlertOctagon}
            iconColor="text-red-700"
            iconBg="bg-red-100"
          />
        </Link>

        <Link to="/issues?priority=HIGH">
          <KPICard
            title="High Priority"
            value={highCount < 10 ? `0${highCount}` : highCount}
            badge="Urgent"
            badgeType="warning"
            subValue="Rapid Dispatch Target"
            icon={AlertTriangle}
            iconColor="text-orange-700"
            iconBg="bg-orange-100"
          />
        </Link>

        <Link to="/recommendations">
          <KPICard
            title="Pending Approvals"
            value={pendingApprovals < 10 ? `0${pendingApprovals}` : pendingApprovals}
            badge="CIE Ready"
            badgeType="info"
            subValue="Awaiting Authorization"
            icon={FileCheck2}
            iconColor="text-sky-700"
            iconBg="bg-sky-100"
          />
        </Link>

        <Link to="/assignments">
          <KPICard
            title="Active Assignments"
            value={activeAssignments < 10 ? `0${activeAssignments}` : activeAssignments}
            badge="In Progress"
            badgeType="neutral"
            subValue="Field Squads Deployed"
            icon={Truck}
            iconColor="text-purple-700"
            iconBg="bg-purple-100"
          />
        </Link>

        <Link to="/issues?status=RESOLVED">
          <KPICard
            title="Resolved"
            value={resolvedCount < 10 ? `0${resolvedCount}` : resolvedCount}
            badge="Verified"
            badgeType="success"
            subValue="Citizen Verified Closure"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
          />
        </Link>
      </div>

      {/* RESOURCE OVERVIEW BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600" />
              <span>Available Municipal Resources</span>
            </h2>
            <p className="text-xs text-slate-700 mt-0.5 font-medium">
              Live available assets ready for immediate dispatch across Kopargaon
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            Ward Pool 1–10
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Budget Available */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-sky-700" />
                <span>Available Budget</span>
              </span>
              <span className="text-xs font-mono font-bold text-sky-800">
                {100 - budgetPct}% Remaining
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                ₹{budgetAvailable.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {budgetPct}% Utilized
              </span>
            </div>
          </div>

          {/* Workers Available */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-700" />
                <span>Available Workers</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-800">
                {100 - workersPct}% Free
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {workersAvailable} Staff
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {workersPct}% Deployed
              </span>
            </div>
          </div>

          {/* Vehicles Available */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>Available Vehicles</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-800">
                {100 - vehiclesPct}% Ready
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {vehiclesAvailable} Fleet
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {vehiclesPct}% On Route
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: PRIORITY ISSUES TABLE & GIS OVERVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Priority Issues Table (7 Cols) */}
        <div className="xl:col-span-7">
          <PriorityTable issues={issues} limit={5} showFilters={true} />
        </div>

        {/* Right: GIS Overview (5 Cols) */}
        <div className="xl:col-span-5">
          <KopargaonMap issues={issues} height="480px" compact={true} />
        </div>
      </div>

      {/* RESOURCE UTILIZATION PROGRESS VISUALIZATIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Resource Utilization</span>
            </h2>
            <p className="text-xs text-slate-700 font-medium">
              Operational load capacity indicators across daily municipal allocation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          {/* Budget Utilization: 72% */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Budget Utilization</span>
              <span className="font-mono font-bold text-sky-700 text-sm">{budgetPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-300"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              ₹1,08,000 spent out of ₹1,50,000 total daily municipal allowance
            </p>
          </div>

          {/* Worker Utilization: 80% */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Workers Utilization</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{workersPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${workersPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              36 of 45 field personnel actively deployed in field squads
            </p>
          </div>

          {/* Vehicle Utilization: 67% */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Vehicles Utilization</span>
              <span className="font-mono font-bold text-amber-700 text-sm">{vehiclesPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${vehiclesPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              8 of 12 fleet compactor trucks and tankers on active routes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
