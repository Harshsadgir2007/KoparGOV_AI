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
      {/* 1. Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Resource Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
            Track teams, vehicles and resources assigned to civic issues across Kopargaon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pending CIE Approvals &rarr;</span>
          </Link>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          title="Active Assignments"
          value={activeCount < 10 ? `0${activeCount}` : activeCount}
          subValue="Teams on ground"
          icon={Truck}
          iconColor="text-purple-700"
          iconBg="bg-purple-100"
          onClick={() => {
            setStatusFilter('ASSIGNED');
          }}
        />

        <KPICard
          title="Pending Assignment"
          value={pendingCount < 10 ? `0${pendingCount}` : pendingCount}
          subValue="Officer authorized"
          badge="Awaiting Dispatch"
          badgeType="info"
          icon={Clock}
          iconColor="text-sky-700"
          iconBg="bg-sky-100"
          onClick={() => {
            setStatusFilter('APPROVED');
          }}
        />

        <KPICard
          title="In Progress"
          value={inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}
          subValue="Work underway"
          badge="Active"
          badgeType="warning"
          icon={Users}
          iconColor="text-amber-700"
          iconBg="bg-amber-100"
          onClick={() => {
            setStatusFilter('IN_PROGRESS');
          }}
        />

        <KPICard
          title="Completed"
          value={completedCount < 10 ? `0${completedCount}` : completedCount}
          subValue="Verified closed"
          badge="Resolved"
          badgeType="success"
          icon={CheckCircle2}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
          onClick={() => {
            setStatusFilter('RESOLVED');
          }}
        />

        <KPICard
          title="Available Workers"
          value="18"
          subValue="Out of 45 total"
          badge="80% Deployed"
          badgeType="neutral"
          icon={Users}
          iconColor="text-indigo-700"
          iconBg="bg-indigo-100"
        />

        <KPICard
          title="Available Vehicles"
          value="06"
          subValue="Out of 12 fleet"
          badge="67% Fleet Locked"
          badgeType="neutral"
          icon={Truck}
          iconColor="text-slate-700"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Filter Bar (Status, Ward, Priority, Team, Vehicle, Search) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team, issue, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Pending Assignment (Approved)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Completed (Resolved)</option>
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <select
              value={wardFilter}
              onChange={e => setWardFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
              aria-label="Filter by Ward"
            >
              <option value="ALL">All Wards</option>
              {KOPARGAON_WARDS.map(w => (
                <option key={w.id} value={`Ward ${w.id}`}>
                  Ward {w.id} ({w.name.split(' - ')[1] || ''})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Level */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
              aria-label="Filter by Priority"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
              aria-label="Filter by Team"
            >
              <option value="ALL">All Teams</option>
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
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
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
          <span className="text-slate-600 font-medium">
            Showing <strong className="text-slate-900">{filteredAssignments.length}</strong> of{' '}
            <strong className="text-slate-900">{assignments.length}</strong> assignments
          </span>

          {(statusFilter !== 'ALL' || wardFilter !== 'ALL' || priorityFilter !== 'ALL' || teamFilter !== 'ALL' || vehicleFilter !== 'ALL' || search) && (
            <button
              onClick={handleResetFilters}
              className="text-sky-700 hover:text-sky-800 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Assignment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Issue</th>
                <th className="py-3.5 px-3">Ward</th>
                <th className="py-3.5 px-3 text-right">Priority</th>
                <th className="py-3.5 px-3">Team</th>
                <th className="py-3.5 px-3">Vehicle</th>
                <th className="py-3.5 px-3 text-right">Workers</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
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
                  <tr key={a.assignment_id} className="hover:bg-slate-50/90 transition-colors group">
                    {/* Issue */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{a.issue_id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({a.assignment_id})</span>
                      </div>
                      <Link
                        to={`/assignments/${a.issue_id}`}
                        className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1 mt-0.5"
                      >
                        {a.issue_title}
                      </Link>
                    </td>

                    {/* Ward */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">{a.ward}</span>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{a.priority}</div>
                      <span className={`text-[10px] font-bold ${
                        a.priority_level === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {a.priority_level}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="py-4 px-3 whitespace-nowrap font-medium text-slate-800">
                      {a.team.split(' (')[0]}
                    </td>

                    {/* Vehicle */}
                    <td className="py-4 px-3 whitespace-nowrap font-medium text-slate-800">
                      {a.vehicle.split(' (')[0]}
                    </td>

                    {/* Workers */}
                    <td className="py-4 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                      {a.workers}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <StatusBadge status={a.status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/assignments/${a.issue_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Assignment</span>
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
