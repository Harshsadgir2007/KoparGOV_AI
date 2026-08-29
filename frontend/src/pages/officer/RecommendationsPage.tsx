import React, { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';
import { CivicIssue } from '../../types';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Truck,
  IndianRupee,
  MapPin,
  Clock,
  ArrowRight,
  UserCheck,
  Building,
  Info,
  Check,
} from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

export const RecommendationsPage: React.FC = () => {
  const { issues, approveRecommendation, assignTeamToIssue } = useCivic();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedIssueId = searchParams.get('issue');

  // Filter issues that have recommendations or are prioritized/approved
  const actionableIssues = issues.filter(i => i.recommendation && i.status !== 'RESOLVED');

  const [activeIssue, setActiveIssue] = useState<CivicIssue>(() => {
    if (selectedIssueId) {
      const found = actionableIssues.find(i => i.id === selectedIssueId);
      if (found) return found;
    }
    return actionableIssues[0] || issues[0];
  });

  // Modal State for Official Approval
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalComplete, setApprovalComplete] = useState(false);

  if (!activeIssue || !activeIssue.recommendation) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">No Pending CIE Recommendations</h2>
        <p className="text-sm text-slate-500 mt-1">All current civic issues have been evaluated or resolved.</p>
        <Link
          to="/issues"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg text-xs"
        >
          <span>View All Issues Registry</span>
        </Link>
      </div>
    );
  }

  const rec = activeIssue.recommendation;
  const impact = rec.resource_impact;

  const handleConfirmApproval = async () => {
    setIsApproving(true);
    await approveRecommendation(activeIssue.id, user.name);
    setIsApproving(false);
    setApprovalComplete(true);
  };

  return (
    <div className="space-y-6">
      {/* GOV MANDATE HEADER: CIE RECOMMENDS — OFFICER DECIDES */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded tracking-wider">
              CIVIC INTELLIGENCE ENGINE
            </span>
            <span className="text-xs text-sky-300 font-medium">Decision Support System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>CIE RECOMMENDS</span>
            <span className="text-sky-400">—</span>
            <span className="text-sky-300">OFFICER DECIDES</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Algorithmic optimization suggests optimal resource distribution based on Kopargaon ward constraints.
            Autonomous execution is strictly prohibited — municipal authorization is mandatory.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-slate-100">Authorized Officer:</div>
            <div className="text-slate-300 truncate font-medium">{user.name}</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: ISSUE SELECTOR LIST + DETAILED RECOMMENDATION ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PENDING RECOMMENDATION QUEUE (4 COLS) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              CIE Queue ({actionableIssues.length})
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Ranked by Priority</span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {actionableIssues.map(issue => {
              const isSelected = issue.id === activeIssue.id;
              return (
                <button
                  key={issue.id}
                  onClick={() => {
                    setActiveIssue(issue);
                    setApprovalComplete(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/90 border-sky-600 shadow-sm ring-1 ring-sky-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-900">{issue.id}</span>
                    <PriorityBadge level={issue.priority_level} score={issue.priority_score} size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {issue.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="truncate max-w-[140px] font-medium">{issue.ward}</span>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: POLISHED CIE RECOMMENDATION PANEL (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            {/* Header with Priority Score & Level */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeIssue.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-700">{activeIssue.ward}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {activeIssue.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeIssue.address}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Logged {activeIssue.age_days}d ago</span>
                  </span>
                </div>
              </div>

              {/* Priority Gauge */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg border sm:border-0 border-slate-200 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    CIE PRIORITY
                  </span>
                  <div className="text-3xl font-black text-slate-900 font-mono leading-none mt-0.5">
                    {activeIssue.priority_score}<span className="text-sm font-normal text-slate-400">/100</span>
                  </div>
                </div>
                <PriorityBadge level={activeIssue.priority_level} size="lg" />
              </div>
            </div>

            {/* RECOMMENDED ACTION CARD */}
            <div className="bg-sky-50/80 rounded-xl p-5 border border-sky-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-sky-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  Recommended Operational Action
                </h3>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {rec.recommended_action}
              </p>

              {/* Resource requirement pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-sky-200/70">
                <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-sky-200">
                  <Truck className="w-4 h-4 text-sky-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 block">Fleet Machinery</span>
                    <span className="text-xs font-bold text-slate-900 truncate block">{rec.vehicle_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-sky-200">
                  <Users className="w-4 h-4 text-sky-700 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Personnel</span>
                    <span className="text-xs font-bold text-slate-900">{rec.required_workers} Field Workers</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-sky-200">
                  <IndianRupee className="w-4 h-4 text-sky-700 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Estimated Cost</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">₹{rec.estimated_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WHY THIS RECOMMENDATION? (RATIONALE BREAKDOWN) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-600" />
                <span>Why this recommendation? (CIE Rationale)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rec.rationales.map((rationale, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium"
                  >
                    <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{rationale}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RESOURCE IMPACT METER */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Resource Impact Analysis (Shift Capacity)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Budget */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Ward Budget</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{impact.budget_required.toLocaleString('en-IN')} / ₹{impact.budget_available.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{ width: `${(impact.budget_required / impact.budget_available) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Workers */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Workers</span>
                    <span className="font-mono font-bold text-slate-900">
                      {impact.workers_required} / {impact.workers_available} Available
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(impact.workers_required / impact.workers_available) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Vehicles */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Vehicles</span>
                    <span className="font-mono font-bold text-slate-900">
                      {impact.vehicles_required} / {impact.vehicles_available} Available
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(impact.vehicles_required / impact.vehicles_available) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* OFFICER DECISION PANEL */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Officer Decision:
                </span>
                <StatusBadge status={activeIssue.status} size="md" />
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/issues/${activeIssue.id}`}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                >
                  Review Details & Evidence
                </Link>

                {activeIssue.status === 'PRIORITIZED' && (
                  <button
                    onClick={() => setIsApprovalModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>APPROVE & ASSIGN</span>
                  </button>
                )}

                {activeIssue.status === 'APPROVED' && (
                  <Link
                    to={`/assignments?issue=${activeIssue.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    <span>PROCEED TO TEAM DISPATCH &rarr;</span>
                  </Link>
                )}

                {activeIssue.status === 'ASSIGNED' && (
                  <Link
                    to={`/assignments?issue=${activeIssue.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VIEW FIELD DISPATCH STATUS</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION APPROVAL MODAL */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setApprovalComplete(false);
        }}
        title="Approve CIE Recommendation"
        subtitle={`Municipal Officer Authorization for Issue #${activeIssue.id}`}
        maxWidth="lg"
      >
        {!approvalComplete ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Official Decision Record: </strong>
                By approving this recommendation, you formally authorize the municipal budget and resource allocation for {activeIssue.ward}.
              </div>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Issue Reference:</span>
                <span className="font-mono font-bold text-slate-900">{activeIssue.id} ({activeIssue.category})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority Score:</span>
                <span className="font-bold text-red-700">{activeIssue.priority_score}/100 — {activeIssue.priority_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Action:</span>
                <span className="font-semibold text-slate-800 max-w-xs text-right">{rec.recommended_action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Personnel & Machinery:</span>
                <span className="font-bold text-slate-900">{rec.required_workers} Workers • {rec.vehicle_type}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Estimated Municipal Cost:</span>
                <span className="font-mono text-slate-900">₹{rec.estimated_cost.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={isApproving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isApproving ? 'Authorizing...' : 'Confirm Approval & Authorize'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Authorization Recorded Successfully</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Issue #{activeIssue.id} is now APPROVED. You may now assign field teams and dispatch machinery.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsApprovalModalOpen(false);
                  navigate(`/assignments?issue=${activeIssue.id}`);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm"
              >
                Proceed to Resource Assignment &rarr;
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
