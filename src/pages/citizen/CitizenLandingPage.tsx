import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CivicIssue, CitizenProfile } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  PlusCircle,
  FileText,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  AlertOctagon,
  ChevronRight,
  Trophy,
  Sliders,
  EyeOff,
  User,
} from 'lucide-react';

export const CitizenLandingPage: React.FC = () => {
  const [recentIssues, setRecentIssues] = useState<CivicIssue[]>([]);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await citizenService.getMyIssues();
      const p = await citizenService.getProfile();
      setProfile(p);
      setRecentIssues(list.slice(0, 3));
      setLoading(false);
    }
    load();

    const handleStateUpdate = () => {
      load();
    };
    window.addEventListener('kopargov_state_updated', handleStateUpdate);
    return () => window.removeEventListener('kopargov_state_updated', handleStateUpdate);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Citizen Home Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider bg-sky-500 text-slate-950 px-2.5 py-0.5 rounded-full">
            Kopargaon Municipal Services
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            KoparGov AI Citizen Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-lg leading-relaxed">
            Report civic problems, protect your privacy, and track real-time resolution stages.
          </p>
        </div>

        {/* Primary Citizen Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to="/citizen/report"
            className="flex items-center justify-between p-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-700/80">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-black text-sm">Report a Problem</span>
                <span className="text-[11px] text-sky-200 font-normal">Anonymous or public lodging</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/citizen/issues"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700">
                <FileText className="w-5 h-5 text-sky-300" />
              </div>
              <div className="text-left">
                <span className="block font-black text-sm">My Complaints</span>
                <span className="text-[11px] text-slate-400 font-normal">Track live resolution stages</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2. Civic Leaderboard & Privacy Status Card */}
      {profile && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Civic Leaderboard & Contribution Score
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              You have <strong className="text-slate-900 font-mono">{profile.reports_count}</strong> filed reports and <strong className="text-emerald-700 font-mono">{profile.resolved_count}</strong> verified resolutions (Score: <strong className="text-amber-600 font-mono">{profile.contribution_score}</strong>).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/citizen/leaderboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>View Leaderboard</span>
            </Link>
            <Link
              to="/citizen/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Privacy</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. Quick Status Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          My Complaints Summary
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-xl sm:text-2xl font-black text-purple-900 font-mono block">02</span>
            <span className="text-[11px] font-bold text-purple-700">Active</span>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono block">05</span>
            <span className="text-[11px] font-bold text-emerald-700">Resolved</span>
          </div>

          <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
            <span className="text-xl sm:text-2xl font-black text-sky-900 font-mono block">01</span>
            <span className="text-[11px] font-bold text-sky-700">Pending Review</span>
          </div>
        </div>
      </div>

      {/* 4. Recent Complaints List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Recent Complaints
          </h2>
          <Link
            to="/citizen/issues"
            className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentIssues.map(issue => (
            <div
              key={issue.id}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{issue.id}</span>
                  <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {issue.ward.split(' - ')[0]}
                  </span>
                  <StatusBadge status={issue.status} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {issue.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Reported: {new Date(issue.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>{issue.is_anonymous ? '🔒 Anonymous' : `👤 ${issue.reporter_display_name || issue.citizen_name}`}</span>
                </div>
              </div>

              <Link
                to={`/citizen/issues/${issue.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-sky-50 hover:text-sky-800 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors shrink-0"
              >
                <span>VIEW STATUS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
