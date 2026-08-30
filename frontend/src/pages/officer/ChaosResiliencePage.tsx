import React, { useState } from 'react';
import { SystemResiliencePanel } from '../../components/dashboard/SystemResiliencePanel';
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  Database,
  Terminal,
  Activity,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useToast } from '../../context/ToastContext';

export const ChaosResiliencePage: React.FC = () => {
  const { submitCitizenIssue } = useCivic();
  const { showToast } = useToast();
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [customTitle, setCustomTitle] = useState('Critical water pipeline burst during municipal power grid outage');
  const [customWard, setCustomWard] = useState('Ward 5 - Shivaji Chowk');

  const handleInjectChaosComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSubmitting(true);
    try {
      const issueId = `ISS-CHAOS-${Math.floor(1000 + Math.random() * 9000)}`;
      await submitCitizenIssue({
        id: issueId,
        title: customTitle,
        description: `${customTitle}. Filed as real-time test payload to verify zero data-loss durability.`,
        category: 'Water Supply & Pipeline',
        ward: customWard,
        ward_number: parseInt(customWard.replace(/\D/g, ''), 10) || 5,
        coordinates: [19.8915, 74.4782],
        address: 'Shivaji Chowk Junction, Kopargaon',
        priority_level: 'CRITICAL',
        priority_score: 92,
        population_affected: 450,
        status: 'REPORTED',
        citizen_name: 'Chaos Simulation Injector',
        is_anonymous: false,
        submitted_at: new Date().toISOString(),
        before_photos: [],
      });
      showToast('success', 'Chaos Incident Injected', `Complaint #${issueId} queued into write-ahead journal.`);
    } catch (err: any) {
      showToast('error', 'Injection Failed', err?.message || 'Could not inject test complaint.');
    } finally {
      setTestSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-red-400" />
              Challenge 1 Focus
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-semibold text-slate-400">Chaos Engineering & High Availability</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-red-400" />
            Civic Data Resilience & Blackout Control Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Simulate catastrophic primary data store outages, grid blackouts, and test the append-only write-ahead journal to verify zero-loss recovery for critical civic complaints.
          </p>
        </div>
      </div>

      {/* 2. Resilience Control Panel & Telemetry Component */}
      <SystemResiliencePanel />

      {/* 3. Chaos Experiment Injection Bench */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Chaos Experiment: In-Flight Complaint Injection
            </h2>
            <p className="text-xs text-slate-400">
              Submit a real-time civic payload while Blackout Mode is active to verify that operations are safely staged in the write-ahead journal without throwing 500 errors.
            </p>
          </div>
        </div>

        <form onSubmit={handleInjectChaosComplaint} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Simulated Incident Description
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="Enter incident scenario..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Target Ward
            </label>
            <select
              value={customWard}
              onChange={(e) => setCustomWard(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="Ward 5 - Shivaji Chowk">Ward 5 - Shivaji Chowk</option>
              <option value="Ward 3 - Subhash Road">Ward 3 - Subhash Road</option>
              <option value="Ward 7 - Godavari Ghat">Ward 7 - Godavari Ghat</option>
              <option value="Ward 2 - Station Road">Ward 2 - Station Road</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              disabled={testSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{testSubmitting ? 'Injecting Chaos Payload...' : 'Inject Test Complaint Into Journal'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Resilience Architecture Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>Dual-Layer Storage</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            During primary DB outages, all writes fall back to an isolated SQLite / in-memory write-ahead journal with strict idempotency keys.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Deterministic Reconciler</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The 3-stage Disaster Recovery Wizard automatically resolves merge conflicts, deduplicates submissions, and recommits offline MCDA urgencies.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Activity className="w-4 h-4" />
            <span>Audit Trail & Telemetry</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Complete cryptographic audit trail preserved for post-incident review, compliance reporting, and municipal disaster documentation.
          </p>
        </div>
      </div>
    </div>
  );
};
