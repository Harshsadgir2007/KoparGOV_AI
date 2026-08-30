import React, { useState, useEffect, useMemo } from 'react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { verificationService } from '../../services/verificationService';
import { VerificationResult } from '../../types/verification';
import { TrustScoreCard } from '../../components/verification/TrustScoreCard';
import { VerificationSignals } from '../../components/verification/VerificationSignals';
import { VerificationDecision } from '../../components/verification/VerificationDecision';
import {
  ShieldCheck,
  Flame,
  Search,
  RefreshCw,
  Eye,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { CivicIssue } from '../../types';

export const TrustVerificationPage: React.FC = () => {
  const { issues, refreshData } = useCivic();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'VERIFIED' | 'UNVERIFIED' | 'BURST'>('ALL');
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIssue, setActiveIssue] = useState<CivicIssue | null>(null);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const list = await verificationService.listVerificationResults();
      const map: Record<string, VerificationResult> = {};
      list.forEach((v) => {
        map[v.issue_id] = v;
      });
      setVerifications(map);
    } catch (e) {
      console.error('Failed to load verifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, [issues]);

  // Derived metrics
  const totalEvaluated = Object.keys(verifications).length;
  const verifiedCount = Object.values(verifications).filter(v => v.verification_status === 'VERIFIED').length;
  const needsReviewCount = Object.values(verifications).filter(v => v.verification_status === 'NEEDS_REVIEW' || v.requires_officer_review).length;
  const burstCount = Object.values(verifications).filter(v =>
    v.signals?.some(s => s.name === 'SUBMISSION_BURST' && s.severity === 'WARNING')
  ).length;

  const avgTrustScore = totalEvaluated > 0
    ? Math.round(Object.values(verifications).reduce((sum, v) => sum + v.trust_score, 0) / totalEvaluated)
    : 85;

  // Filtered Issues list
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const ver = verifications[issue.id];
      const matchSearch =
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.ward.toLowerCase().includes(searchQuery.toLowerCase());

      const matchWard = wardFilter === 'ALL' || issue.ward.includes(wardFilter);

      let matchStatus = true;
      if (statusFilter === 'NEEDS_REVIEW') {
        matchStatus = ver?.verification_status === 'NEEDS_REVIEW' || ver?.requires_officer_review === true;
      } else if (statusFilter === 'VERIFIED') {
        matchStatus = ver?.verification_status === 'VERIFIED';
      } else if (statusFilter === 'UNVERIFIED') {
        matchStatus = ver?.verification_status === 'UNVERIFIED';
      } else if (statusFilter === 'BURST') {
        matchStatus = Boolean(ver?.signals?.some(s => s.name === 'SUBMISSION_BURST' && s.severity === 'WARNING'));
      }

      return matchSearch && matchWard && matchStatus;
    });
  }, [issues, verifications, searchQuery, wardFilter, statusFilter]);

  const handleOverrideSuccess = (updated: VerificationResult) => {
    setVerifications(prev => ({ ...prev, [updated.issue_id]: updated }));
    showToast('success', 'Verification Updated', `Issue #${updated.issue_id} status updated to ${updated.verification_status}.`);
    refreshData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Challenge 2 Focus
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-semibold text-slate-400">Citizen Trust & Anti-Fraud Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Civic Trust, Sentiment & Verification Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Deterministic multi-signal trust scoring to automatically catch submission bursts, evaluate citizen dissatisfaction / sentiment indicators, and gate AI resource allocation behind verified civic signals.
          </p>
        </div>

        <button
          onClick={loadVerifications}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Evaluate All</span>
        </button>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Trust Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{avgTrustScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <p className="text-[10px] text-slate-400">Deterministic signal confidence</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verified Complaints</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{verifiedCount}</span>
            <span className="text-xs text-slate-500">of {totalEvaluated || issues.length}</span>
          </div>
          <p className="text-[10px] text-slate-400">High corroboration & trust</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Needs Officer Review</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{needsReviewCount}</span>
            <span className="text-xs text-amber-500 font-bold">Action Required</span>
          </div>
          <p className="text-[10px] text-slate-400">Low confidence or anomaly flagged</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submission Bursts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-400 font-mono">{burstCount}</span>
            <span className="text-xs text-red-400 font-bold">Spam Floods</span>
          </div>
          <p className="text-[10px] text-slate-400">Rapid duplicates within 30m window</p>
        </div>
      </div>

      {/* 3. Citizen Sentiment & "Bad Feeling" / Dissatisfaction Map Section */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Ward Dissatisfaction & Citizen Sentiment Index
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated citizen sentiment, repeated lodging escalations, and grievance severity by municipal sector.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            Real-time Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Ward 5 (Shivaji Chowk)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                High Frustration
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Recurrent pipeline leakages causing frequent submission bursts. High citizen urgency index (94/100).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Ward 7 (Godavari Ghat)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Elevated Concern
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Monsoon drainage accumulation reports. Corroborated by 4 independent citizen accounts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Ward 3 (Subhash Road)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Normal Pulse
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Streetlight and routine road repair requests. Pacing within standard operational thresholds.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Issues ({issues.length})
          </button>
          <button
            onClick={() => setStatusFilter('NEEDS_REVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'NEEDS_REVIEW'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Needs Review ({needsReviewCount})
          </button>
          <button
            onClick={() => setStatusFilter('BURST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'BURST'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Submission Bursts ({burstCount})
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Verified ({verifiedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, or ward..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* 5. Issue Verification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Issue ID & Details</th>
                <th className="py-3 px-4">Ward / Reporter</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Key Signals Detected</th>
                <th className="py-3 px-4 text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIssues.map((issue) => {
                const ver = verifications[issue.id];
                const score = ver?.trust_score ?? (issue.priority_level === 'CRITICAL' ? 88 : 75);
                const status = ver?.verification_status ?? (score >= 80 ? 'VERIFIED' : 'NEEDS_REVIEW');
                const isBurst = ver?.signals?.some(s => s.name === 'SUBMISSION_BURST' && s.severity === 'WARNING');

                return (
                  <tr key={issue.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                            {issue.id}
                          </span>
                          <span className="font-bold text-slate-200">{issue.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{issue.description}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="space-y-0.5">
                        <span className="font-medium block">{issue.ward}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {issue.is_anonymous ? '🔒 Anonymous Citizen' : `👤 ${issue.citizen_name || 'Citizen'}`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${
                            score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {score}/100
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : status === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {status}
                          </span>
                        </div>
                        {isBurst && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800">
                            <Flame className="w-3 h-3" /> Burst Alert
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ver?.signals && ver.signals.length > 0 ? (
                          ver.signals.slice(0, 2).map((sig, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                sig.severity === 'POSITIVE'
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                                  : sig.severity === 'WARNING'
                                  ? 'bg-red-950/40 text-red-300 border-red-800/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {sig.name.replace(/_/g, ' ')} ({sig.score_impact > 0 ? `+${sig.score_impact}` : sig.score_impact})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">Autonomous evaluation active</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveIssue(issue)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Gate</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Officer Inspection & Override Modal */}
      {activeIssue && verifications[activeIssue.id] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                    {activeIssue.id}
                  </span>
                  <h3 className="text-base font-bold text-white">{activeIssue.title}</h3>
                </div>
                <p className="text-xs text-slate-400">{activeIssue.ward} • Reported by {activeIssue.citizen_name || 'Citizen'}</p>
              </div>
              <button
                onClick={() => setActiveIssue(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrustScoreCard
                verification={verifications[activeIssue.id]}
              />
              <VerificationSignals
                signals={verifications[activeIssue.id]?.signals}
              />
            </div>

            <VerificationDecision
              issueId={activeIssue.id}
              currentVerification={verifications[activeIssue.id]}
              userRole={user.officer_role || user.role}
              officerName={user.name}
              onVerificationUpdated={handleOverrideSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};
