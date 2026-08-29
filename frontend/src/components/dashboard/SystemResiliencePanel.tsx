import React, { useState, useEffect, useCallback } from 'react';
import {
  ResilienceStatusResponse,
  RecoveryReport,
  OperationRecord,
} from '../../types/resilience';
import { resilienceService } from '../../services/resilienceService';
import { RecoveryWizardModal } from '../resilience/RecoveryWizardModal';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  RotateCcw,
  Camera,
  Database,
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const SystemResiliencePanel: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<ResilienceStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState<boolean>(false);
  const [lastReport, setLastReport] = useState<RecoveryReport | null>(null);
  const [journalModalOpen, setJournalModalOpen] = useState<boolean>(false);
  const [journalLogs, setJournalLogs] = useState<OperationRecord[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await resilienceService.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load resilience telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Auto-poll live backend resilience status every 3 seconds
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 3000);

    const handleResilienceUpdate = () => {
      fetchStatus();
    };

    window.addEventListener('kopargov_resilience_updated', handleResilienceUpdate);
    window.addEventListener('kopargov_state_updated', handleResilienceUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('kopargov_resilience_updated', handleResilienceUpdate);
      window.removeEventListener('kopargov_state_updated', handleResilienceUpdate);
    };
  }, [fetchStatus]);

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      const report = await resilienceService.recoverSystem();
      setLastReport(report);
      setRecoveryModalOpen(true);
      await fetchStatus();
      showToast('success', 'System Recovered', `Restored ${report.records_recovered} records with ${report.operations_replayed} replayed operations.`);
    } catch (err) {
      showToast('error', 'Recovery Error', 'Failed to complete recovery sequence.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSnapshot = async () => {
    try {
      const snap = await resilienceService.createSnapshot('Manual Officer Snapshot');
      await fetchStatus();
      showToast('success', 'Snapshot Captured', `Saved state snapshot ${snap.snapshot_id} with ${snap.record_count} records.`);
    } catch (err) {
      showToast('error', 'Snapshot Error', 'Failed to capture snapshot.');
    }
  };

  const handleResetDemo = async () => {
    try {
      await resilienceService.resetDemo();
      await fetchStatus();
      showToast('info', 'Demo State Reset', 'Clean baseline snapshot established and normal operational mode restored.');
    } catch (err) {
      showToast('error', 'Reset Error', 'Failed to reset demo state.');
    }
  };

  const handleViewJournal = async () => {
    try {
      const logs = await resilienceService.listJournal(25);
      setJournalLogs(logs);
      setJournalModalOpen(true);
    } catch (err) {
      showToast('error', 'Journal Error', 'Failed to load journal records.');
    }
  };

  if (loading && !status) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse h-32" />
    );
  }

  const isBlackout = status?.is_blackout_active || status?.system_mode === 'DEGRADED';

  return (
    <>
      <div
        className={`rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden ${
          isBlackout
            ? 'bg-linear-to-r from-red-50 via-amber-50 to-red-50 border-red-300 ring-2 ring-red-400/40 animate-pulse'
            : 'bg-white border-slate-200/80'
        }`}
      >
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                isBlackout
                  ? 'bg-red-600 text-white border-red-700 animate-bounce'
                  : 'bg-slate-900 text-sky-400 border-slate-800'
              }`}
            >
              {isBlackout ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Civic Data Resilience & Chaos Layer
                </h3>
                {isBlackout ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-300 animate-pulse">
                      🔴 PRIMARY STORE UNAVAILABLE
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-800 text-white">
                      SYSTEM IN DEGRADED RESILIENCE MODE
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    🟢 ONLINE (NORMAL)
                  </span>
                )}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                  Chaos Challenge
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
                Real-time fault tolerance with last-known-good state snapshots and immutable operation journaling.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isBlackout && (
              <button
                onClick={handleRecover}
                disabled={isRecovering}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isRecovering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Reconstructing State...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>RECOVER SYSTEM</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleSnapshot}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Capture Manual Snapshot"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Snapshot</span>
            </button>

            <button
              onClick={handleViewJournal}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Operation Journal"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Journal ({status?.journal_operations_count || 0})</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="p-2.5 rounded-xl border border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset Demo State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Degraded Alert Banner if Blackout is active */}
        {isBlackout && (
          <div className="bg-red-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 animate-bounce" />
              <span>
                PRIMARY DATA STORE OFFLINE: Unsafe direct writes are locked. Operations are buffered in append-only resilience memory.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-red-800 px-2 py-0.5 rounded">
              DEGRADED MODE
            </span>
          </div>
        )}

        {/* Resilience Telemetry Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 text-xs">
          {/* Primary Store Status */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Primary Store</span>
            </span>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.primary_store_online ? 'bg-emerald-500' : 'bg-red-500 animate-ping'
                }`}
              />
              <span className={status?.primary_store_online ? 'text-emerald-700' : 'text-red-700'}>
                {status?.primary_store_online ? 'Firestore Online' : 'Store Failed / Offline'}
              </span>
            </div>
          </div>

          {/* Last-Known-Good Snapshot */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Snapshot</span>
            </span>
            <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded text-[10px]">
                {status?.last_snapshot?.snapshot_id || 'SNAP-001'}
              </span>
              <span>({status?.last_snapshot?.record_count || 0} records)</span>
            </div>
          </div>

          {/* Operation Journal Entries */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Operation Journal</span>
            </span>
            <div className="font-mono font-bold text-slate-800">
              <span>{status?.journal_operations_count || 0} Operations</span>
              <span className="text-slate-400 text-[10px] ml-1.5">
                ({status?.pending_operations_count || 0} post-snap)
              </span>
            </div>
          </div>

          {/* Recoverable Entities */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Recoverable Entities</span>
            </span>
            <div className="font-mono font-bold text-emerald-700">
              {status?.recoverable_records_count || 0} Records Ready
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Wizard Modal */}
      <RecoveryWizardModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        report={lastReport}
        onRecoveryComplete={() => fetchStatus()}
      />

      {/* Journal Audit Modal */}
      {journalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black">Append-Only Civic Operation Journal</h3>
              </div>
              <button
                onClick={() => setJournalModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2 text-xs flex-1">
              {journalLogs.length > 0 ? (
                journalLogs.map(op => (
                  <div
                    key={op.operation_id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{op.operation_id}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                          {op.operation_type}
                        </span>
                        <span className="font-mono text-slate-500">Target: {op.entity_id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Checksum: {op.checksum} • {new Date(op.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        op.status === 'COMMITTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : op.status === 'REPLAYED'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {op.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">No journal operations logged yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
