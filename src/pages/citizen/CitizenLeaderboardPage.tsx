import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CitizenProfile, LeaderboardEntry } from '../../types';
import {
  Trophy,
  Medal,
  Award,
  ShieldCheck,
  EyeOff,
  User,
  CheckCircle2,
  FileText,
  Sparkles,
  Info,
  ArrowRight,
  TrendingUp,
  Sliders,
} from 'lucide-react';

export const CitizenLeaderboardPage: React.FC = () => {
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await citizenService.getLeaderboard();
      setProfile(data.current_user);
      setLeaderboard(data.entries);
      setLoading(false);
    }
    loadData();

    const handleStateUpdate = () => {
      loadData();
    };
    window.addEventListener('kopargov_state_updated', handleStateUpdate);
    return () => window.removeEventListener('kopargov_state_updated', handleStateUpdate);
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm shadow-xs border border-amber-300">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm shadow-xs border border-slate-300">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm shadow-xs border border-orange-300">
          🥉
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-xs border border-slate-200">
        #{rank}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Civic Leaderboard
            </h1>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              KOPARGAON HONORS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Recognizing active citizens and community contributors driving civic improvements.
          </p>
        </div>

        <Link
          to="/citizen/profile"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Identity Settings</span>
        </Link>
      </div>

      {/* 1. CURRENT USER CONTRIBUTION BANNER */}
      {profile && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Your Civic Contribution</span>
              </div>

              <div className="mt-2 flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {profile.leaderboard_enabled
                    ? (profile.identity_mode === 'ANONYMOUS' ? (profile.alias || 'CivicChampion') : profile.real_name)
                    : profile.real_name}
                </h2>

                {profile.leaderboard_enabled ? (
                  profile.identity_mode === 'ANONYMOUS' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 border border-slate-600">
                      <EyeOff className="w-3 h-3 text-slate-300" />
                      <span>Anonymous identity protected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-900/60 text-sky-300 border border-sky-500/40">
                      <User className="w-3 h-3 text-sky-300" />
                      <span>Public profile</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Not on public leaderboard
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4 sm:gap-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Civic Score</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{profile.contribution_score}</span>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reports</span>
                  <span className="text-base font-bold text-white font-mono">{profile.reports_count}</span>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Resolved</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{profile.resolved_count}</span>
                </div>
              </div>
            </div>

            {!profile.leaderboard_enabled && (
              <Link
                to="/citizen/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0"
              >
                <span>Join Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 2. LEADERBOARD LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Medal className="w-4 h-4 text-sky-600" />
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Top Civic Champions
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Kopargaon Municipal Ward Area
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {leaderboard.map(item => {
            const isAnon = item.identity_type === 'ANONYMOUS';

            return (
              <div
                key={`${item.rank}-${item.display_name}`}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                  item.is_current_user
                    ? 'bg-sky-50/50 hover:bg-sky-50 ring-1 ring-inset ring-sky-200'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Left: Rank & Contributor Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {getRankBadge(item.rank)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {item.display_name}
                      </span>
                      {item.is_current_user && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white px-2 py-0.2 rounded-full">
                          You
                        </span>
                      )}
                    </div>

                    {/* Privacy & Identity Tag */}
                    <div className="mt-0.5 flex items-center gap-2">
                      {isAnon ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          <span>Anonymous contributor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700">
                          <User className="w-3 h-3 text-sky-600" />
                          <span>Public contributor</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Score */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-right">
                  <div className="hidden sm:block text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reports</span>
                    <span className="font-bold text-slate-800 font-mono">{item.reports}</span>
                  </div>

                  <div className="hidden sm:block text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Resolved</span>
                    <span className="font-bold text-emerald-600 font-mono">{item.resolved}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Score</span>
                    <div className="inline-flex items-center gap-1">
                      <span className="font-black text-slate-900 text-base sm:text-lg font-mono">
                        {item.score}
                      </span>
                      <Sparkles className="w-3 h-3 text-amber-500 hidden sm:inline" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            The leaderboard rewards meaningful civic participation, not spam. Contribution metrics consider valid and resolved civic reports verified by municipal officers.
          </p>
        </div>
      </div>
    </div>
  );
};
