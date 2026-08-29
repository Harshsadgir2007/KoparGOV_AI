import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCivic } from '../../context/CivicContext';
import { IssueSummaryCards } from '../../components/issues/IssueSummaryCards';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton';
import { KOPARGAON_WARDS } from '../../data/mockData';
import {
  Search,
  Calendar,
  Eye,
  ArrowUpDown,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const { issues, loading } = useCivic();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');
  const [wardFilter, setWardFilter] = useState(searchParams.get('ward') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'age' | 'id'>('priority');

  const categories = useMemo(() => Array.from(new Set(issues.map(i => i.category))), [issues]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter(issue => {
        if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
        if (wardFilter !== 'ALL' && issue.ward_number.toString() !== wardFilter) return false;
        if (priorityFilter !== 'ALL' && issue.priority_level !== priorityFilter) return false;
        if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
        if (dateFilter !== 'ALL') {
          if (dateFilter === 'TODAY' && issue.age_days !== 0) return false;
          if (dateFilter === '3DAYS' && issue.age_days > 3) return false;
          if (dateFilter === '7DAYS' && issue.age_days > 7) return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            issue.id.toLowerCase().includes(q) ||
            issue.title.toLowerCase().includes(q) ||
            issue.description.toLowerCase().includes(q) ||
            issue.address.toLowerCase().includes(q) ||
            issue.ward.toLowerCase().includes(q) ||
            issue.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priority_score - a.priority_score;
        if (sortBy === 'age') return b.age_days - a.age_days;
        if (sortBy === 'id') return b.id.localeCompare(a.id);
        return 0;
      });
  }, [issues, search, categoryFilter, wardFilter, priorityFilter, statusFilter, dateFilter, sortBy]);

  const handleCardFilterSelect = (filterVal: string) => {
    if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(filterVal)) {
      setPriorityFilter(filterVal);
      setStatusFilter('ALL');
    } else if (['PRIORITIZED', 'IN_PROGRESS', 'RESOLVED', 'ASSIGNED'].includes(filterVal)) {
      setStatusFilter(filterVal);
      setPriorityFilter('ALL');
    } else {
      setPriorityFilter('ALL');
      setStatusFilter('ALL');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setWardFilter('ALL');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setSortBy('priority');
  };

  if (loading && issues.length === 0) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" rows={6} />
        <LoadingSkeleton type="table" rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Civic Issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
            Monitor, prioritize and track reported civic problems across Kopargaon Municipal Council.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Issue,Category,Ward,Priority,Level,Status,Age Days,Population']
                  .concat(
                    filteredIssues.map(
                      i => `${i.id},"${i.category}","${i.ward}",${i.priority_score},${i.priority_level},${i.status},${i.age_days},${i.population_affected}`
                    )
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `kopargov_civic_issues_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <IssueSummaryCards
        issues={issues}
        activeFilter={priorityFilter !== 'ALL' ? priorityFilter : statusFilter}
        onFilterSelect={handleCardFilterSelect}
      />

      {/* 3. Filter Bar (Search, Category, Ward, Priority, Status, Date) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keyword or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
              aria-label="Filter by Category"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
              <option value="ALL">All Wards (1-10)</option>
              {KOPARGAON_WARDS.map(w => (
                <option key={w.id} value={w.id.toString()}>
                  {w.name.split(' - ')[0]} ({w.name.split(' - ')[1] || ''})
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
              <option value="CRITICAL">🔴 Critical (85-100)</option>
              <option value="HIGH">🟠 High (70-84)</option>
              <option value="MEDIUM">🟡 Medium (50-69)</option>
              <option value="LOW">🟢 Low (0-49)</option>
            </select>
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
              <option value="REPORTED">Reported</option>
              <option value="VALIDATED">Validated</option>
              <option value="PRIORITIZED">CIE Prioritized</option>
              <option value="APPROVED">Officer Approved</option>
              <option value="ASSIGNED">Team Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-sky-500"
              aria-label="Filter by Date"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Reported Today</option>
              <option value="3DAYS">Last 3 Days</option>
              <option value="7DAYS">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filter Counter & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-700 font-medium flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900">{filteredIssues.length}</strong> of{' '}
              <strong className="text-slate-900">{issues.length}</strong> issues
            </span>
            {(categoryFilter !== 'ALL' || wardFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter !== 'ALL' || search) && (
              <button
                onClick={handleResetFilters}
                className="text-sky-700 hover:text-sky-800 font-bold inline-flex items-center gap-1 ml-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <button
              onClick={() => setSortBy('priority')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                sortBy === 'priority' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              CIE Priority
            </button>
            <button
              onClick={() => setSortBy('age')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                sortBy === 'age' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Complaint Age
            </button>
            <button
              onClick={() => setSortBy('id')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                sortBy === 'id' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ID
            </button>
          </div>
        </div>
      </div>

      {/* 4. Issue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Issue</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Ward</th>
                <th className="py-3.5 px-3 text-right">Priority</th>
                <th className="py-3.5 px-3">Level</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Age</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <EmptyState
                      title="No civic issues found"
                      description="No issues match the current filter criteria. Try adjusting your search query or reset filters."
                      actionText="Reset All Filters"
                      onAction={handleResetFilters}
                    />
                  </td>
                </tr>
              ) : (
                filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50/90 transition-colors group">
                    {/* Issue ID & Title */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-mono font-bold text-slate-900 text-xs">{issue.id}</div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1 mt-0.5"
                      >
                        {issue.title}
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {issue.category}
                      </span>
                    </td>

                    {/* Ward */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {issue.ward.split(' - ')[0]}
                      </span>
                    </td>

                    {/* Priority (Score) */}
                    <td className="py-4 px-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                      {issue.priority_score}
                    </td>

                    {/* Level */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <PriorityBadge level={issue.priority_level} size="sm" showIcon={true} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <StatusBadge status={issue.status} size="sm" />
                    </td>

                    {/* Age */}
                    <td className="py-4 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {issue.age_days === 0 ? 'Today' : `${issue.age_days} days`}
                    </td>

                    {/* Action: View Details */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
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
