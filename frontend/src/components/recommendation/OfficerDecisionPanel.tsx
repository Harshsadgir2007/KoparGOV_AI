import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CIERecommendationDetail, ApprovalStep, AuthorityRole } from '../../types';
import { useAuth, OFFICER_PRESETS } from '../../context/AuthContext';
import { recommendationService } from '../../services/recommendationService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import {
  ShieldCheck,
  FileCheck,
  RotateCcw,
  XCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface OfficerDecisionPanelProps {
  recommendation: CIERecommendationDetail;
  onApprove?: () => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  onRequestReview?: (note: string) => Promise<void>;
  isProcessing?: boolean;
}

export const OfficerDecisionPanel: React.FC<OfficerDecisionPanelProps> = ({
  recommendation,
  isProcessing = false,
}) => {
  const navigate = useNavigate();
  const { user, loginAsSpecificOfficer } = useAuth();
  const { showToast } = useToast();

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [processingStep, setProcessingStep] = useState(false);

  const currentOfficerRole: AuthorityRole = user.officer_role || 'CHIEF_OFFICER';
  const approvalChain = recommendation.authority_routing?.approval_chain || [];

  const currentPendingStep = approvalChain.find(s => s.status === 'PENDING');
  const isAllApproved = approvalChain.length > 0 && approvalChain.every(s => s.status === 'APPROVED');
  const isMyTurn = currentPendingStep && currentPendingStep.role === currentOfficerRole;
  const isAlreadyApprovedByMe = approvalChain.some(
    s => s.role === currentOfficerRole && s.status === 'APPROVED'
  );

  const handleConfirmStepApproval = async () => {
    if (!currentPendingStep) return;
    setProcessingStep(true);
    try {
      const result = await recommendationService.approveStep(
        recommendation.issue_id,
        currentPendingStep.role,
        user.name,
        'Approved and verified on site.'
      );

      setApproveModalOpen(false);

      if (result.isFinalApproval) {
        showToast(
          'success',
          'Full Authorization Granted',
          `Issue #${recommendation.issue_id} authorized for immediate municipal resource assignment!`
        );
      } else {
        showToast(
          'info',
          'Step Approved & Escalated',
          `Cleared by ${user.name}. Now unlocked for ${result.nextStepTitle || 'next officer'}.`
        );
      }
    } catch (e) {
      console.error('Error approving step:', e);
      showToast('error', 'Approval Error', 'Failed to record step approval.');
    } finally {
      setProcessingStep(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!currentPendingStep) return;
    setProcessingStep(true);
    try {
      await recommendationService.rejectStep(
        recommendation.issue_id,
        currentPendingStep.role,
        user.name,
        rejectReason || 'Rejected at checkpoint'
      );
      setRejectModalOpen(false);
      showToast(
        'info',
        'Issue Rejected',
        `Returned to preliminary validation queue by ${user.name}. Higher officers will not be bothered.`
      );
    } catch (e) {
      console.error('Error rejecting step:', e);
    } finally {
      setProcessingStep(false);
    }
  };

  const handleConfirmReview = async () => {
    setProcessingStep(true);
    try {
      await recommendationService.requestReviewRecommendation(
        recommendation.issue_id,
        reviewNote || 'Recalibration requested'
      );
      setReviewModalOpen(false);
      showToast('info', 'Review Requested', 'CIE recalibration logged with officer notes.');
    } catch (e) {
      console.error('Error requesting review:', e);
    } finally {
      setProcessingStep(false);
    }
  };

  if (isAllApproved || recommendation.status === 'APPROVED') {
    return (
      <div className="bg-emerald-50/90 rounded-2xl border-2 border-emerald-500 p-6 shadow-sm space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900 block">
              ✓ Full Sequential Approval Cleared
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Ready for Municipal Resource Assignment
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Authorized across all requisite municipal clearance levels. Resource package is staged in the Kopargaon assignment registry.
        </p>

        {/* Display approval trail */}
        <div className="space-y-1.5 pt-2">
          {approvalChain.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-200 text-xs"
            >
              <span className="font-semibold text-slate-800">
                {idx + 1}. {step.title}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                ✓ {step.officer_name || 'Approved'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
          <button
            onClick={() => navigate(`/assignments?issue=${recommendation.issue_id}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <span>CONTINUE TO RESOURCE ASSIGNMENT</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/issues')}
            className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer"
          >
            Return to Issues Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900 text-white">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Officer Decision Gate
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Multi-tier human-in-the-loop authorization
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          ● {currentPendingStep ? currentPendingStep.title : 'Pending Review'}
        </span>
      </div>

      {/* Philosophy Banner */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium space-y-1">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold">
          <Layers className="w-4 h-4 text-sky-700" />
          <span>CIE Executive Protection Principle:</span>
        </div>
        <p>
          Lower officers must verify and approve on-site before issues reach higher authorities. This ensures the CMO is never overwhelmed with unverified complaints.
        </p>
      </div>

      {/* Sequential Approval Hierarchy & Response SLA */}
      {recommendation.authority_routing && (
        <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>Required Clearance: {recommendation.authority_routing.authority_title}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200 font-mono self-start sm:self-auto">
              Target SLA: {recommendation.authority_routing.expected_response_sla_hours}h ({recommendation.priority_level})
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {approvalChain.map((step: ApprovalStep, idx: number) => {
              const isCurrent = step.status === 'PENDING';
              const isDone = step.status === 'APPROVED';

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                    isCurrent
                      ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300'
                      : isDone
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{step.title}</span>
                      {step.officer_name && (
                        <span className="text-[10px] text-emerald-700 font-medium block">
                          Signed by {step.officer_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCurrent
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓ Approved' : isCurrent ? '● Action Required' : '🔒 Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Logged-In Officer Info */}
      <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Signed in as:
            </span>
            <span className="font-bold text-white">
              {user.name} ({user.designation})
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 1-Click Persona Switcher for Hackathon Live Demo */}
      <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          Demo Quick-Switch Persona:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => loginAsSpecificOfficer('WARD_INCHARGE')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              currentOfficerRole === 'WARD_INCHARGE'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs font-black'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            1. Ward 5 In-Charge
          </button>
          <button
            type="button"
            onClick={() => loginAsSpecificOfficer('DEPARTMENT_OFFICER')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              currentOfficerRole === 'DEPARTMENT_OFFICER'
                ? 'bg-sky-600 text-white border-sky-700 shadow-xs font-black'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            2. Sanitation Head
          </button>
          <button
            type="button"
            onClick={() => loginAsSpecificOfficer('CHIEF_OFFICER')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              currentOfficerRole === 'CHIEF_OFFICER'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            3. Chief Officer (CMO)
          </button>
          <button
            type="button"
            onClick={() => loginAsSpecificOfficer('TAHSILDAR_OR_RELEVANT_AUTHORITY')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              currentOfficerRole === 'TAHSILDAR_OR_RELEVANT_AUTHORITY'
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs font-black'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            4. Tahsildar
          </button>
        </div>
      </div>

      {/* Role-Enforced Action Buttons */}
      {isMyTurn ? (
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setApproveModalOpen(true)}
            disabled={processingStep || isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>
              {currentOfficerRole === 'WARD_INCHARGE'
                ? 'APPROVE STEP 1 (WARD FIELD VERIFICATION)'
                : currentOfficerRole === 'DEPARTMENT_OFFICER'
                ? 'SANCTION STEP 2 (DEPARTMENTAL UNIT ALLOCATION)'
                : currentOfficerRole === 'CHIEF_OFFICER'
                ? 'AUTHORIZE STEP 3 (CHIEF MUNICIPAL CLEARANCE)'
                : 'GRANT STEP 4 (TALUKA JURISDICTION CLEARANCE)'}
            </span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setReviewModalOpen(true)}
              disabled={processingStep}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REQUEST RECALIBRATION</span>
            </button>

            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={processingStep}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-700 font-semibold rounded-lg text-xs border border-red-200 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              <span>REJECT AT THIS STAGE</span>
            </button>
          </div>
        </div>
      ) : isAlreadyApprovedByMe ? (
        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            You have already cleared your clearance step ({user.designation}). Awaiting review by higher authority.
          </span>
        </div>
      ) : (
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Approval Locked at Current Tier</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            This issue is currently awaiting field verification by{' '}
            <strong>{currentPendingStep ? currentPendingStep.title : 'lower officer'}</strong>.
            Higher authorities are protected from unverified complaints until lower officers clear Step 1.
          </p>
        </div>
      )}

      {/* APPROVAL MODAL */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title={`Authorize Clearance: ${currentPendingStep?.title || 'Approval Step'}`}
        subtitle={`Signing as ${user.name} (${user.designation})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Issue ID:</span>
              <strong className="text-slate-900 font-bold">{recommendation.issue_id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority Score:</span>
              <strong className="text-red-700 font-mono font-bold">
                {recommendation.priority_score} ({recommendation.priority_level})
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Action:</span>
              <strong className="text-slate-900 font-bold">{recommendation.recommended_action.headline}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Signing Authority:</span>
              <strong className="text-sky-900 font-bold">{user.name}</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            By confirming clearance, your digital stamp will be recorded and the issue will escalate to the next clearance tier.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setApproveModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmStepApproval}
              disabled={processingStep}
              className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {processingStep ? 'Signing...' : 'Confirm Digital Authorization'}
            </button>
          </div>
        </div>
      </Modal>

      {/* REJECTION MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject at this Clearance Level?"
        subtitle="Mandatory justification required for municipal audit"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Rejection Reason & Field Findings *
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
              placeholder="e.g. Field inspection confirmed already resolved / duplicate complaint..."
              required
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Rejecting returns this complaint to the preliminary queue. Higher authorities will not receive this issue.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRejection}
              disabled={processingStep || !rejectReason.trim()}
              className="px-5 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {processingStep ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* REVIEW MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Request CIE Recalibration"
        subtitle="Provide feedback on algorithm parameters"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Review Notes *
            </label>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
              placeholder="Detail why resource allocation or priority score requires review..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReview}
              disabled={processingStep}
              className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {processingStep ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
