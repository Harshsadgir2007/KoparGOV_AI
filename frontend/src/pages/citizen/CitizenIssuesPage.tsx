import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CivicIssue } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const CitizenIssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await citizenService.getMyIssues(activeFilter);
      setIssues(list);
      setLoading(false);
    }
    load();
  }, [activeFilter]);

  return (
    <div className="space-y-6">
      {/* 12. Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Complaints
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
            Track real-time progress and resolution of your submitted issues.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Complaint</span>
        </Link>
      </div>

      {/* 12. Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['ALL', 'ACTIVE', 'IN_PROGRESS', 'RESOLVED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeFilter === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'ALL' && 'All Complaints'}
            {tab === 'ACTIVE' && 'Active'}
            {tab === 'IN_PROGRESS' && 'In Progress'}
            {tab === 'RESOLVED' && 'Resolved'}
          </button>
        ))}
      </div>

      {/* Complaints List or Empty State */}
      {issues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              You haven't submitted any complaints yet.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Help keep Kopargaon clean, safe, and well-maintained by reporting civic issues.
            </p>
          </div>
          <Link
            to="/citizen/report"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report a Problem</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div
              key={issue.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {issue.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {issue.ward.split(' - ')[0]}
                  </span>
                  <StatusBadge status={issue.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  {issue.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span>Category: <strong className="text-slate-700">{issue.category}</strong></span>
                  <span>•</span>
                  <span>Reported: {new Date(issue.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <Link
                to={`/citizen/issues/${issue.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                <span>VIEW STATUS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
