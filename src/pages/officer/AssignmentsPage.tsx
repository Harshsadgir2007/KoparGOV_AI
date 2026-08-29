import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assignmentService, AssignmentFilters } from '../../services/assignmentService';
import { MunicipalAssignment } from '../../types';
import { KPICard } from '../../components/common/KPICard';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState, LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { KOPARGAON_WARDS } from '../../data/mockData';
import {
  Truck,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<MunicipalAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const list = await assignmentService.getAssignments();
      setAssignments(list);
      setLoading(false);
    }
    loadData();

    const handleStateUpdate = () => {
      loadData();
    };
    window.addEventListener('kopargov_state_updated', handleStateUpdate);
    return () => window.removeEventListener('kopargov_state_updated', handleStateUpdate);
  }, []);

  const teams = useMemo(() => Array.from(new Set(assignments.map(a => a.team))), [assignments]);
  const vehicles = useMemo(() => Array.from(new Set(assignments.map(a => a.vehicle))), [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (wardFilter !== 'ALL' && !a.ward.includes(wardFilter)) return false;
      if (priorityFilter !== 'ALL' && a.priority_level !== priorityFilter) return false;
      if (teamFilter !== 'ALL' && a.team !== teamFilter) return false;
      if (vehicleFilter !== 'ALL' && a.vehicle !== vehicleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.assignment_id.toLowerCase().includes(q) ||
          a.issue_id.toLowerCase().includes(q) ||
          a.issue_title.toLowerCase().includes(q) ||
          a.team.toLowerCase().includes(q) ||
          a.vehicle.toLowerCase().includes(q) ||
          a.ward.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assignments, search, statusFilter, wardFilter, priorityFilter, teamFilter, vehicleFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setWardFilter('ALL');
    setPriorityFilter('ALL');
    setTeamFilter('ALL');
    setVehicleFilter('ALL');
  };

  // KPIs
  const activeCount = assignments.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS').length;
  const pendingCount = assignments.filter(a => a.status === 'APPROVED').length;
  const inProgressCount = assignments.filter(a => a.status === 'IN_PROGRESS').length;
  const completedCount = assignments.filter(a => a.status === 'RESOLVED').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" rows={6} />
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Resource Assignments
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Dispatch Operations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl">
            Track teams, machinery and vehicles deployed to resolve prioritized civic issues across Kopargaon.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all hover:shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Pending CIE Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Summary KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KPICard
          title="Active Field Teams"
          value={activeCount}
          subValue="Active on ground"
          icon={Truck}
          iconColor="text-purple-700"
          iconBg="bg-purple-50"
          onClick={() => setStatusFilter('ASSIGNED')}
        />

        <KPICard
          title="Pending Dispatch"
          value={pendingCount}
          subValue="Awaiting dispatch"
          badge={pendingCount > 0 ? 'Urgent' : undefined}
          badgeType="warning"
          icon={Clock}
          iconColor="text-sky-700"
          iconBg="bg-sky-50"
          onClick={() => setStatusFilter('APPROVED')}
        />

        <KPICard
          title="In Progress"
          value={inProgressCount}
          subValue="Work underway"
          badge={inProgressCount > 0 ? 'Operating' : undefined}
          badgeType="info"
          icon={Users}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
          onClick={() => setStatusFilter('IN_PROGRESS')}
        />

        <KPICard
          title="Resolved & Closed"
          value={completedCount}
          subValue="Verified closed"
          badge="Verified"
          badgeType="success"
          icon={CheckCircle2}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
          onClick={() => setStatusFilter('RESOLVED')}
        />

        <KPICard
          title="Available Personnel"
          value={18}
          subValue="80% deployed (36/45)"
          icon={Users}
          iconColor="text-indigo-700"
          iconBg="bg-indigo-50"
        />

        <KPICard
          title="Available Fleet"
          value={6}
          subValue="67% on route (8/12)"
          icon={Truck}
          iconColor="text-slate-700"
          iconBg="bg-slate-100"
        />
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team, issue, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-600 text-xs font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300/80 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-600 text-xs"
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Pending Dispatch</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved & Closed</option>
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <select
              value={wardFilter}
              onChange={e => setWardFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300/80 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-600 text-xs"
              aria-label="Filter by Ward"
            >
              <option value="ALL">All Wards</option>
              {KOPARGAON_WARDS.map(w => (
                <option key={w.id} value={`Ward ${w.id}`}>
                  Ward {w.id} — {w.name.split(' - ')[1] || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Level */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300/80 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-600 text-xs"
              aria-label="Filter by Priority"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">🔴 Critical (80-100)</option>
              <option value="HIGH">🟠 High (60-79)</option>
              <option value="MEDIUM">🟡 Medium (40-59)</option>
              <option value="LOW">🟢 Low (0-39)</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300/80 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-600 text-xs"
              aria-label="Filter by Team"
            >
              <option value="ALL">All Municipal Teams</option>
              {teams.map(t => (
                <option key={t} value={t}>
                  {t.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300/80 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-1 focus:ring-sky-600 text-xs"
              aria-label="Filter by Vehicle"
            >
              <option value="ALL">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v} value={v}>
                  {v.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter and reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-mono">{filteredAssignments.length}</strong> of{' '}
            <strong className="text-slate-900 font-mono">{assignments.length}</strong> records
          </span>

          {(statusFilter !== 'ALL' || wardFilter !== 'ALL' || priorityFilter !== 'ALL' || teamFilter !== 'ALL' || vehicleFilter !== 'ALL' || search) && (
            <button
              onClick={handleResetFilters}
              className="text-sky-700 hover:text-sky-800 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Assignment Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-5">Issue & Reference</th>
                <th className="py-3.5 px-4">Ward Location</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4">Assigned Team</th>
                <th className="py-3.5 px-4">Machinery / Fleet</th>
                <th className="py-3.5 px-3 text-center">Personnel</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <EmptyState
                      title="No assignments found"
                      description="No records match the current filters. Adjust your search or reset filters."
                      actionText="Reset Filters"
                      onAction={handleResetFilters}
                    />
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(a => (
                  <tr key={a.assignment_id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Issue */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {a.issue_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {a.assignment_id}
                        </span>
                      </div>
                      <Link
                        to={`/assignments/${a.issue_id}`}
                        className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1 mt-1 block"
                      >
                        {a.issue_title}
                      </Link>
                    </td>

                    {/* Ward */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{a.ward.split(' - ')[0]}</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[120px]">
                        {a.ward.split(' - ')[1] || ''}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="font-mono font-black text-slate-900 text-sm">{a.priority}</div>
                      <span className={`text-[10px] font-bold ${
                        a.priority_level === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {a.priority_level}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{a.team.split(' (')[0]}</span>
                      <span className="text-[10px] text-slate-500 block">Sanitation Unit</span>
                    </td>

                    {/* Vehicle */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{a.vehicle.split(' (')[0]}</span>
                      <span className="text-[10px] text-purple-700 font-mono block">Active Fleet</span>
                    </td>

                    {/* Workers */}
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center font-mono font-bold text-xs bg-slate-100 text-slate-800 w-7 h-7 rounded-full">
                        {a.workers}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={a.status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        to={`/assignments/${a.issue_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage Dispatch</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
