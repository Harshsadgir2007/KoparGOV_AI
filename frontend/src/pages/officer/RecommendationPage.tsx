import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CIERecommendationDetail } from '../../types';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RecommendedActionCard } from '../../components/recommendation/RecommendedActionCard';
import { WhyCIERecommends } from '../../components/recommendation/WhyCIERecommends';
import { ResourceAvailabilityCard } from '../../components/recommendation/ResourceAvailabilityCard';
import { AlternativeAllocations } from '../../components/recommendation/AlternativeAllocations';
import { OfficerDecisionPanel } from '../../components/recommendation/OfficerDecisionPanel';
import {
  Sparkles,
  ArrowLeft,
  ShieldAlert,
  Info,
  Scale,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const RecommendationPage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryIssue = searchParams.get('issue');
  const issueId = paramId || queryIssue || 'ISS-1024';

  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [recommendation, setRecommendation] = useState<CIERecommendationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await recommendationService.getRecommendation(issueId);
      if (data) {
        setRecommendation(data);
      }
      setLoading(false);
    }
    loadData();
  }, [issueId]);

  const handleApprove = async () => {
    if (!recommendation) return;
    setIsProcessing(true);
    await recommendationService.approveRecommendation(recommendation.issue_id, user.name);
    setRecommendation({
      ...recommendation,
      status: 'APPROVED',
      approved_by: user.name,
      approved_at: new Date().toISOString(),
    });
    setIsProcessing(false);
    showToast('success', 'Recommendation Approved', `Issue #${recommendation.issue_id} authorized for execution`);
  };

  const handleReject = async (reason: string) => {
    if (!recommendation) return;
    setIsProcessing(true);
    await recommendationService.rejectRecommendation(recommendation.issue_id, reason);
    setRecommendation({
      ...recommendation,
      status: 'VALIDATED',
    });
    setIsProcessing(false);
    showToast('info', 'Recommendation Rejected', 'Issue returned to preliminary validation queue');
  };

  const handleRequestReview = async (note: string) => {
    if (!recommendation) return;
    setIsProcessing(true);
    await recommendationService.requestReviewRecommendation(recommendation.issue_id, note);
    setIsProcessing(false);
    showToast('info', 'Review Requested', 'CIE recalibration logged with officer notes');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6 bg-white rounded-xl border border-slate-200">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="h-72 bg-slate-100 rounded-xl"></div>
          <div className="h-72 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Recommendation Not Found</h2>
        <p className="text-xs text-slate-500">
          No algorithmic recommendation is available for reference #{issueId}.
        </p>
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 text-white font-bold rounded-lg text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Issues Registry</span>
        </Link>
      </div>
    );
  }

  const factorRows = [
    { label: 'Severity', value: recommendation.factors.severity },
    { label: 'Urgency', value: recommendation.factors.urgency },
    { label: 'Population affected', value: recommendation.factors.population_affected },
    { label: 'Health/Safety', value: recommendation.factors.health_safety },
    { label: 'Location sensitivity', value: recommendation.factors.location_sensitivity },
    { label: 'Complaint age', value: recommendation.factors.complaint_age_days },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/issues')}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Back to issues"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 font-medium">Civic Intelligence Engine</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono font-bold text-slate-900">{recommendation.issue_id}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Civic Intelligence Engine</span>
            </span>
            <StatusBadge status={recommendation.status} size="md" />
          </div>
        </div>

        <div className="pt-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              {recommendation.issue_id}
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {recommendation.ward}
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {recommendation.category}
            </span>
            {recommendation.rank !== undefined && (
              <span className="font-mono text-xs font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                Queue Rank #{recommendation.rank}
              </span>
            )}
            {recommendation.recommendation_status && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                recommendation.recommendation_status === 'RECOMMENDED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {recommendation.recommendation_status === 'RECOMMENDED' ? '✓ OR-Tools Selected' : '⏸ OR-Tools Deferred'}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {recommendation.issue_title}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Resource-aware recommendation generated by KoparGov Civic Intelligence Engine.
          </p>
        </div>
      </div>

      {/* CORE PHILOSOPHY BANNER: CIE RECOMMENDS — OFFICER DECIDES */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-xl shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                CIE Recommends — Officer Decides
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Decision-support intelligence providing explainable allocation options with human-in-the-loop authorization.
            </p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN DESKTOP LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 2. Priority Hero + 3. Factor Breakdown + 5. Why CIE Recommends (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 2. Priority Hero Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                CIE Priority Score
              </span>
              <PriorityBadge level={recommendation.priority_level} size="md" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                {recommendation.priority_score}
              </span>
              <span className="text-lg font-bold text-slate-400 font-mono">/ 100</span>
              <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 ml-auto">
                {recommendation.priority_level}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              Priority generated from severity, urgency, population impact, health/safety, location sensitivity and complaint age.
            </p>

            {/* 3. Priority Factor Breakdown (6 Backend-Provided Factors) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Priority Factor Breakdown
              </h3>
              <div className="space-y-3">
                {factorRows.map(row => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{row.label}</span>
                      <span className="font-mono font-bold text-slate-900">{row.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          row.value >= 85
                            ? 'bg-red-600'
                            : row.value >= 70
                            ? 'bg-orange-500'
                            : row.value >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Why CIE Recommends This Action */}
          <WhyCIERecommends reasons={recommendation.reasons} />
        </div>

        {/* RIGHT COLUMN: 4. Recommended Action + 6. Resource Availability + 7. Alternatives + 8. Decision (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 4. Recommended Action Card */}
          <RecommendedActionCard
            headline={recommendation.recommended_action.headline}
            vehicle={recommendation.recommended_action.vehicle}
            workers={recommendation.recommended_action.workers}
            estimatedCost={recommendation.recommended_action.estimated_cost}
            estimatedTime={recommendation.recommended_action.estimated_time}
          />

          {/* 6. Resource Availability Section */}
          <ResourceAvailabilityCard resources={recommendation.resource_availability} />

          {/* 7. Alternative Allocations Section */}
          <AlternativeAllocations alternatives={recommendation.alternatives} />

          {/* 8. Officer Decision Panel with Human-in-the-loop Gate */}
          <OfficerDecisionPanel
            recommendation={recommendation}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestReview={handleRequestReview}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};
