import React, { useState } from 'react';
import { VerificationResult, VerificationStatus } from '../../types/verification';
import { verificationService } from '../../services/verificationService';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, ShieldX, AlertCircle, CheckCircle, RefreshCw, UserCheck } from 'lucide-react';
import { Modal } from '../common/Modal';

interface VerificationDecisionProps {
  issueId: string;
  currentVerification: VerificationResult | null;
  onVerificationUpdated: (updated: VerificationResult) => void;
  userRole?: string;
  officerName?: string;
}

export const VerificationDecision: React.FC<VerificationDecisionProps> = ({
  issueId,
  currentVerification,
  onVerificationUpdated,
  userRole = 'DEPARTMENT_OFFICER',
  officerName = 'Municipal Officer',
}) => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<VerificationStatus>('VERIFIED');
  const [officerNotes, setOfficerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reevaluating, setReevaluating] = useState(false);

  const isCitizen = userRole.toUpperCase() === 'CITIZEN';

  const handleOpenModal = (status: VerificationStatus) => {
    if (isCitizen) {
      showToast('error', 'Access Denied', 'Citizens are not permitted to authorize verification decisions.');
      return;
    }
    setTargetStatus(status);
    setOfficerNotes('');
    setModalOpen(true);
  };

  const handleConfirmOverride = async () => {
    setSubmitting(true);
    try {
      const result = await verificationService.overrideVerification(
        issueId,
        {
          status: targetStatus,
          officer_id: officerName,
          notes: officerNotes || undefined,
        },
        userRole
      );

      if (result) {
        onVerificationUpdated(result);
        setModalOpen(false);
        showToast(
          'success',
          'Verification Updated',
          `Issue #${issueId} manually marked as ${targetStatus} by ${officerName}.`
        );
      } else {
        showToast('error', 'Update Failed', 'Could not record verification override.');
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to submit verification override.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReevaluate = async () => {
    setReevaluating(true);
    try {
      const result = await verificationService.reevaluateVerification(issueId);
      if (result) {
        onVerificationUpdated(result);
        showToast('success', 'Verification Re-evaluated', `Computed latest trust score: ${result.trust_score.toFixed(0)}/100`);
      }
    } catch (err) {
      showToast('error', 'Re-evaluation Failed', 'Could not re-evaluate issue verification.');
    } finally {
      setReevaluating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-white">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            Officer Verification Actions
          </h3>
          <p className="text-[11px] text-slate-400">
            Manual ground verification authority (Restricted to Municipal Officers)
          </p>
        </div>

        <button
          onClick={handleReevaluate}
          disabled={reevaluating}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
          title="Re-run verification algorithm against current complaint database"
        >
          <RefreshCw className={`w-3 h-3 ${reevaluating ? 'animate-spin text-sky-400' : ''}`} />
          <span>Re-evaluate</span>
        </button>
      </div>

      {isCitizen ? (
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Citizen accounts cannot alter verification statuses. Officer inspection required.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => handleOpenModal('VERIFIED')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>MARK VERIFIED</span>
            </button>

            <button
              onClick={() => handleOpenModal('UNVERIFIED')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
            >
              <ShieldX className="w-4 h-4" />
              <span>MARK UNVERIFIED</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Active Reviewer: <strong className="text-slate-200">{officerName}</strong></span>
            </span>
            <span className="font-mono text-slate-500">RBAC Enforcement Active</span>
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Officer Verification Override: #${issueId}`}
        subtitle={`Set civic trust status to ${targetStatus}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Reviewing Authority</span>
            <p className="text-slate-900 font-medium">
              {officerName} ({userRole})
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Verification Notes & Ground Inspection Proof (Optional)
            </label>
            <textarea
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g. Verified via on-site inspection with Ward 5 field team. Site conditions confirmed."
              rows={3}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmOverride}
              disabled={submitting}
              className={`px-5 py-2 font-bold text-white rounded-lg shadow-sm cursor-pointer transition-colors ${
                targetStatus === 'VERIFIED'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {submitting ? 'Recording...' : `Confirm: Mark ${targetStatus}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
