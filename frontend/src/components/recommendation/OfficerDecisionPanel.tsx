import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CIERecommendationDetail } from '../../types';
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
} from 'lucide-react';

interface OfficerDecisionPanelProps {
  recommendation: CIERecommendationDetail;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onRequestReview: (note: string) => Promise<void>;
  isProcessing?: boolean;
}

export const OfficerDecisionPanel: React.FC<OfficerDecisionPanelProps> = ({
  recommendation,
  onApprove,
  onReject,
  onRequestReview,
  isProcessing = false,
}) => {
  const navigate = useNavigate();

  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [approvedSuccess, setApprovedSuccess] = useState(recommendation.status === 'APPROVED');

  const handleConfirmApproval = async () => {
    await onApprove();
    setApproveModalOpen(false);
    setApprovedSuccess(true);
  };

  const handleConfirmRejection = async () => {
    await onReject(rejectReason);
    setRejectModalOpen(false);
  };

  const handleConfirmReview = async () => {
    await onRequestReview(reviewNote);
    setReviewModalOpen(false);
  };

  if (approvedSuccess || recommendation.status === 'APPROVED') {
    return (
      <div className="bg-emerald-50/80 rounded-xl border-2 border-emerald-400 p-6 shadow-sm space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900 block">
              ✓ Recommendation Approved
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Ready for Resource Assignment
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Authorized for execution by Officer. The proposed resource package has been reserved in the municipal staging queue.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => navigate(`/assignments?issue=${recommendation.issue_id}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <span>CONTINUE TO ASSIGNMENT</span>
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
    <div className="bg-white rounded-xl border-2 border-slate-300 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-900 text-white">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Officer Decision
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Human-in-the-loop authorization gate
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Pending Approval
        </span>
      </div>

      {/* Mandatory Philosophy Text */}
      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <strong className="text-slate-900 font-bold">Important Notice: </strong>
        The CIE recommendation requires review and approval by an authorized officer. CIE recommends — Officer decides.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        {/* Primary Action */}
        <button
          onClick={() => setApproveModalOpen(true)}
          disabled={isProcessing}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>APPROVE & ASSIGN</span>
        </button>

        {/* Secondary Action */}
        <button
          onClick={() => setReviewModalOpen(true)}
          disabled={isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>REQUEST REVIEW</span>
        </button>

        {/* Tertiary Action */}
        <button
          onClick={() => setRejectModalOpen(true)}
          disabled={isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-red-50 text-red-700 font-semibold rounded-xl text-xs border border-red-200 transition-colors cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>REJECT</span>
        </button>
      </div>

      {/* 9. APPROVAL CONFIRMATION MODAL */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve CIE Recommendation?"
        subtitle="Confirm allocation of municipal resources for execution"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Issue:</span>
              <strong className="text-slate-900 font-bold">{recommendation.issue_title} — {recommendation.ward}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority:</span>
              <strong className="text-red-700 font-bold font-mono">
                {recommendation.priority_score} — {recommendation.priority_level}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Action:</span>
              <strong className="text-slate-900 font-bold">{recommendation.recommended_action.headline}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Estimated Cost:</span>
              <strong className="text-slate-900 font-bold font-mono">
                ₹{recommendation.recommended_action.estimated_cost.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            By confirming approval, you authorize deployment of team and equipment. This action logs your digital officer stamp.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setApproveModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirmApproval}
              disabled={isProcessing}
              className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer"
            >
              CONFIRM APPROVAL
            </button>
          </div>
        </div>
      </Modal>

      {/* REQUEST REVIEW MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Request Recalibration / Review"
        subtitle="Provide feedback to adjust priority weights or resource requirements"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Review Instructions / Notes</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="e.g. Ward council meeting rescheduled; verify if evening shift can handle without peak congestion..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
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
              className="px-5 py-2 font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm cursor-pointer"
            >
              Submit Review Request
            </button>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Recommendation"
        subtitle="Reject this proposed action package"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Reason for Rejection</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate issue or handled via state road works program..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRejection}
              className="px-5 py-2 font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
