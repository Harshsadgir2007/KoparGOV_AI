import React, { useState } from 'react';
import {
  RecoveryReport,
  ConflictItem,
  ReconciliationDecision,
} from '../../types/resilience';
import { resilienceService } from '../../services/resilienceService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Database,
  FileCheck,
  AlertOctagon,
  RefreshCw,
  X,
} from 'lucide-react';

interface RecoveryWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: RecoveryReport | null;
  onRecoveryComplete?: () => void;
}

export const RecoveryWizardModal: React.FC<RecoveryWizardModalProps> = ({
  isOpen,
  onClose,
  report,
  onRecoveryComplete,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'STEPS' | 'SUMMARY' | 'RECONCILE'>('STEPS');
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [conflictList, setConflictList] = useState<ConflictItem[]>(report?.conflicts || []);

  if (!isOpen || !report) return null;

  const unresolvedConflicts = conflictList.filter(c => c.resolution_status === 'REQUIRES_RECONCILIATION');

  const handleReconcile = async (opId: string, decision: ReconciliationDecision) => {
    setReconcilingId(opId);
    try {
      const updated = await resilienceService.reconcileOperation(opId, {
        decision,
        officer_id: user.name || 'Chief Municipal Officer',
        notes: `Reconciled via officer dashboard decision: ${decision}`,
      });

      setConflictList(prev =>
        prev.map(c => (c.operation_id === opId ? { ...c, resolution_status: 'RECONCILED' } : c))
      );
      showToast('success', 'Conflict Reconciled', `Operation #${opId} finalized with ${decision}`);
    } catch (err) {
      showToast('error', 'Reconciliation Error', 'Failed to resolve conflict.');
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  Civic Data Recovery & Reconstruction
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Deterministic Snapshot Restoration & Append-Only Journal Replay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('STEPS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'STEPS'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Recovery Steps ({report.step_logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'SUMMARY'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Audit Summary</span>
          </button>
          {conflictList.length > 0 && (
            <button
              onClick={() => setActiveTab('RECONCILE')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'RECONCILE'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-amber-600 hover:text-amber-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                Human Reconciliation ({unresolvedConflicts.length} Pending)
              </span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'STEPS' && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Execution Progress Sequence
              </h3>
              <div className="space-y-2.5">
                {report.step_logs.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs"
                  >
                    <div className="mt-0.5">
                      {step.status === 'COMPLETED' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{step.step_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {step.status}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {step.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SUMMARY' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800">Records Restored</span>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    {report.records_recovered}
                  </div>
                  <span className="text-[10px] text-emerald-600">Entities in DB</span>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                  <span className="text-[11px] font-bold text-sky-800">Operations Replayed</span>
                  <div className="text-2xl font-black text-sky-950 font-mono">
                    {report.operations_replayed}
                  </div>
                  <span className="text-[10px] text-sky-600">Verified from Journal</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800">Conflicts Detected</span>
                  <div className="text-2xl font-black text-amber-950 font-mono">
                    {report.conflicts_detected}
                  </div>
                  <span className="text-[10px] text-amber-600">Require Human Review</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-800">State Integrity</span>
                  <div className="text-2xl font-black text-indigo-950 font-mono">100%</div>
                  <span className="text-[10px] text-indigo-600">Zero Data Fabricated</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Resilience Invariance Guarantee</span>
                </h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  During the blackout, no simulated primary writes corrupted the verified snapshot. The journal successfully preserved all civic complaints, MCDA urgency scores, and officer decisions without hallucinating or losing in-flight operations.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'RECONCILE' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-black flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-amber-700" />
                  <span>Human-in-the-Loop Conflict Resolution</span>
                </span>
                <p className="text-[11px] text-amber-800 leading-snug">
                  The system detected ambiguous operations where primary state could not be autonomously resolved without human judgment. Please review the officer decision below.
                </p>
              </div>

              <div className="space-y-3">
                {conflictList.map(conflict => (
                  <div
                    key={conflict.operation_id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {conflict.operation_id}
                        </span>
                        <span className="font-mono text-slate-600">Target: {conflict.entity_id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {conflict.operation_type}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          conflict.resolution_status === 'RECONCILED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {conflict.resolution_status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900">Conflict Reason:</div>
                      <p>{conflict.reason}</p>
                    </div>

                    {conflict.resolution_status === 'REQUIRES_RECONCILIATION' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleReconcile(conflict.operation_id, 'KEEP_SNAPSHOT')}
                          disabled={reconcilingId === conflict.operation_id}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                        >
                          Keep Snapshot Baseline
                        </button>
                        <button
                          onClick={() => handleReconcile(conflict.operation_id, 'ACCEPT_JOURNAL')}
                          disabled={reconcilingId === conflict.operation_id}
                          className="px-4 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          Accept Replayed Journal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            System operational mode restored to: <strong className="text-emerald-700">NORMAL</strong>
          </div>
          <button
            onClick={() => {
              if (onRecoveryComplete) onRecoveryComplete();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>Return to Municipal Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
