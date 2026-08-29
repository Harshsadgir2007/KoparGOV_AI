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
  Sparkles,
  ArrowRight,
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

  // Calculate actual dynamic numbers from issues if available
  const criticalCount = issues.filter(i => i.priority_level === 'CRITICAL' && i.status !== 'RESOLVED').length || MOCK_KPIS.critical_issues;
  const highCount = issues.filter(i => i.priority_level === 'HIGH' && i.status !== 'RESOLVED').length || MOCK_KPIS.high_priority;
  const pendingApprovals = issues.filter(i => i.status === 'PRIORITIZED').length || MOCK_KPIS.pending_approvals;
  const activeAssignments = issues.filter(i => i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length || MOCK_KPIS.active_assignments;
  const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length || MOCK_KPIS.resolved;

  const budgetAvailable = resources?.available_budget || MOCK_KPIS.budget_available;
  const workersAvailable = resources?.available_workers || MOCK_KPIS.workers_available;
  const vehiclesAvailable = resources?.available_vehicles || MOCK_KPIS.vehicles_available;

  const budgetPct = MOCK_KPIS.budget_utilization_pct;
  const workersPct = MOCK_KPIS.workers_utilization_pct;
  const vehiclesPct = MOCK_KPIS.vehicles_utilization_pct;

  return (
    <div className="space-y-6">
      {/* Civic Operations Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Civic Operations Overview
            </h1>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 font-bold border border-sky-200">
              KOPARGAON
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl">
            Municipal Command & Decision-Support • Powered by Civic Intelligence Engine (CIE)
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refreshData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            title="Sync Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync</span>
          </button>

          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-xs transition-all hover:shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Review CIE Queue ({pendingApprovals < 10 ? `0${pendingApprovals}` : pendingApprovals})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 5 KPI CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Link to="/issues?priority=CRITICAL" className="block">
          <KPICard
            title="Critical Hazards"
            value={criticalCount}
            badge="Hazard"
            badgeType="danger"
            subValue="Immediate risk"
            icon={AlertOctagon}
            iconColor="text-red-700"
            iconBg="bg-red-50"
          />
        </Link>

        <Link to="/issues?priority=HIGH" className="block">
          <KPICard
            title="High Priority"
            value={highCount}
            badge="Urgent"
            badgeType="warning"
            subValue="Rapid dispatch"
            icon={AlertTriangle}
            iconColor="text-orange-700"
            iconBg="bg-orange-50"
          />
        </Link>

        <Link to="/recommendations" className="block">
          <KPICard
            title="Pending Approvals"
            value={pendingApprovals}
            badge="CIE Ready"
            badgeType="info"
            subValue="Awaiting sign-off"
            icon={FileCheck2}
            iconColor="text-sky-700"
            iconBg="bg-sky-50"
          />
        </Link>

        <Link to="/assignments" className="block">
          <KPICard
            title="Active Dispatches"
            value={activeAssignments}
            subValue="Field squads active"
            icon={Truck}
            iconColor="text-purple-700"
            iconBg="bg-purple-50"
          />
        </Link>

        <Link to="/issues?status=RESOLVED" className="block">
          <KPICard
            title="Resolved & Verified"
            value={resolvedCount}
            badge="Verified"
            badgeType="success"
            subValue="Verified closure"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-50"
          />
        </Link>
      </div>

      {/* RESOURCE OVERVIEW BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600" />
              <span>Available Municipal Resources</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Live available assets ready for immediate dispatch across Kopargaon
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            Ward Jurisdiction 1–10
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Budget Available */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-sky-700" />
                <span>Available Budget</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {100 - budgetPct}% Left
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ₹{budgetAvailable.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {budgetPct}% Utilized
              </span>
            </div>
          </div>

          {/* Workers Available */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-700" />
                <span>Available Personnel</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {100 - workersPct}% Free
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {workersAvailable} Staff
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {workersPct}% Deployed
              </span>
            </div>
          </div>

          {/* Vehicles Available */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>Available Fleet</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {100 - vehiclesPct}% Ready
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {vehiclesAvailable} Fleet
              </span>
              <span className="text-xs text-slate-500 font-medium">
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
          <KopargaonMap issues={issues} height="460px" compact={true} />
        </div>
      </div>

      {/* RESOURCE UTILIZATION PROGRESS VISUALIZATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Resource Utilization</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Operational load capacity indicators across daily municipal allocation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          {/* Budget Utilization: 72% */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Budget Burn Rate</span>
              <span className="font-mono font-bold text-sky-800 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">{budgetPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-300"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ₹1,08,000 spent of ₹1,50,000 total daily municipal allowance
            </p>
          </div>

          {/* Worker Utilization: 80% */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Field Personnel Deployment</span>
              <span className="font-mono font-bold text-indigo-800 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">{workersPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${workersPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              36 of 45 field personnel actively deployed in field squads
            </p>
          </div>

          {/* Vehicle Utilization: 67% */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Fleet Operations</span>
              <span className="font-mono font-bold text-amber-800 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">{vehiclesPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${vehiclesPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              8 of 12 fleet compactor trucks and tankers on active routes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
