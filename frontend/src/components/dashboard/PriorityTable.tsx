import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CivicIssue } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Sparkles, Search, Filter, ArrowRight, Clock, MapPin, Eye, ChevronRight } from 'lucide-react';
import { KOPARGAON_WARDS } from '../../data/mockData';

interface PriorityTableProps {
  issues: CivicIssue[];
  limit?: number;
  showFilters?: boolean;
}

export const PriorityTable: React.FC<PriorityTableProps> = ({
  issues,
  limit,
  showFilters = true,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const categories = useMemo(() => Array.from(new Set(issues.map(i => i.category))), [issues]);

  const filteredIssues = useMemo(() => {
    let result = issues.filter(issue => {
      if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
      if (wardFilter !== 'ALL' && issue.ward_number.toString() !== wardFilter) return false;
      if (priorityFilter !== 'ALL' && issue.priority_level !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          issue.id.toLowerCase().includes(q) ||
          issue.title.toLowerCase().includes(q) ||
          issue.ward.toLowerCase().includes(q) ||
          issue.category.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }, [issues, categoryFilter, wardFilter, priorityFilter, statusFilter, search, limit]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Prioritized Civic Queue</span>
            </h2>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              Live MCDA Triage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Multi-criteria prioritization ranking across active Kopargaon issues
          </p>
        </div>
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors self-start sm:self-auto"
        >
          <span>View All Registry</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="p-3 bg-slate-50/70 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search issue..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 text-xs font-medium"
            />
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs"
            aria-label="Filter by Category"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c.split(' ')[0]}
              </option>
            ))}
          </select>

          {/* Ward */}
          <select
            value={wardFilter}
            onChange={e => setWardFilter(e.target.value)}
            className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs"
            aria-label="Filter by Ward"
          >
            <option value="ALL">All Wards</option>
            {KOPARGAON_WARDS.map(w => (
              <option key={w.id} value={w.id.toString()}>
                {w.name.split(' - ')[0]}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs"
            aria-label="Filter by Priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs"
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="PRIORITIZED">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
              <th className="py-3.5 px-4">Issue ID</th>
              <th className="py-3.5 px-3">Title & Category</th>
              <th className="py-3.5 px-3">Ward</th>
              <th className="py-3.5 px-3 text-center">Score</th>
              <th className="py-3.5 px-3">Priority</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No issues matching criteria.
                </td>
              </tr>
            ) : (
              filteredIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Issue ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <Link to={`/issues/${issue.id}`} className="hover:text-sky-700 flex items-center gap-1">
                      <span>{issue.id}</span>
                    </Link>
                  </td>

                  {/* Title & Category */}
                  <td className="py-3.5 px-3 max-w-xs">
                    <Link
                      to={`/issues/${issue.id}`}
                      className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1 block"
                    >
                      {issue.title}
                    </Link>
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      {issue.category}
                    </span>
                  </td>

                  {/* Ward */}
                  <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap font-semibold">
                    {issue.ward.split(' - ')[0]}
                  </td>

                  {/* Priority Score */}
                  <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-center whitespace-nowrap">
                    {issue.priority_score}
                  </td>

                  {/* Priority Level */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <PriorityBadge level={issue.priority_level} showIcon={true} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={issue.status} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/issues/${issue.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
