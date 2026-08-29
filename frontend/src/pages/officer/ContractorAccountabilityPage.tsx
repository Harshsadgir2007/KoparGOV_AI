import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HardHat,
  ClipboardList,
  Building2,
  Calendar,
  Phone,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { contractorService } from '../../services/contractorService';
import {
  Contractor,
  MunicipalProject,
  ContractorAccountabilityEvent,
  InspectionOutcome,
} from '../../types';
import { Modal } from '../../components/common/Modal';

export const ContractorAccountabilityPage: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<MunicipalProject[]>([]);
  const [events, setEvents] = useState<ContractorAccountabilityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspection Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<MunicipalProject | null>(null);
  const [inspectionOutcome, setInspectionOutcome] = useState<InspectionOutcome>('REQUIRES_REWORK');
  const [officerName, setOfficerName] = useState('Shri. Rajesh Kulkarni (CMO)');
  const [inspectionNotes, setInspectionNotes] = useState(
    'Sub-base asphalt degradation and unsealed stormwater joints observed. Surface milling and repaving required within 7 business days.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, pList, eList] = await Promise.all([
        contractorService.getContractors(),
        contractorService.getProjects(),
        contractorService.getAccountabilityEvents(),
      ]);
      setContractors(cList);
      setProjects(pList);
      setEvents(eList);
    } catch (e) {
      console.error('Error loading contractor accountability data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStateUpdate = () => loadData();
    window.addEventListener('kopargov_state_updated', handleStateUpdate);
    return () => window.removeEventListener('kopargov_state_updated', handleStateUpdate);
  }, []);

  const handleOpenInspect = (proj: MunicipalProject) => {
    setSelectedProject(proj);
    setInspectModalOpen(true);
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      await contractorService.recordInspection(selectedProject.project_id, {
        project_id: selectedProject.project_id,
        officer_id: 'CMO-01',
        officer_name: officerName,
        outcome: inspectionOutcome,
        inspection_notes: inspectionNotes,
      });
      setSuccessToast(`Inspection recorded successfully for ${selectedProject.project_id}!`);
      setInspectModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to record inspection:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const flaggedProjects = projects.filter(
    p => p.cie_inspection_status === 'INSPECTION_RECOMMENDED'
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-900 text-amber-400">
              <HardHat className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Contractor Accountability & Quality Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Post-completion public works durability audit, defect signal detection, and on-site inspection logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-300">
            Kopargaon Municipal Council
          </span>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Monitored Projects
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{projects.length}</span>
            <span className="text-xs font-bold text-slate-500">Public Works</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-50 border border-red-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Inspection Recommended</span>
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-900">{flaggedProjects.length}</span>
            <span className="text-xs font-bold text-red-700">Immediate Action</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Registered Contractors
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{contractors.length}</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">100% Audited</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Accountability Events
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{events.length}</span>
            <span className="text-xs font-bold text-slate-500 font-mono">Immutable Trail</span>
          </div>
        </div>
      </div>

      {/* CIE Inspection Recommended High Alert Banner */}
      {flaggedProjects.map(proj => (
        <div
          key={proj.project_id}
          className="rounded-2xl border-2 border-red-500 bg-red-50/90 p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-red-900 bg-red-200/80 px-2 py-0.5 rounded border border-red-300">
                  CIE Critical Signal: Inspection Recommended
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {proj.asset_name} ({proj.project_id})
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Contractor: <strong>{proj.contractor_name}</strong> • Ward: <strong>{proj.ward}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenInspect(proj)}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <ClipboardList className="w-4 h-4" />
              <span>LOG ON-SITE INSPECTION</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-red-200 text-xs space-y-2">
            <strong className="text-slate-900 font-bold block">Deterministic CIE Rationale:</strong>
            <p className="text-slate-700 leading-relaxed font-medium">
              {proj.cie_rationale}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Total Complaints</span>
                <span className="text-sm font-black text-red-700 font-mono">
                  {proj.post_completion_complaints}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Safety Complaints</span>
                <span className="text-sm font-black text-red-700 font-mono">
                  {proj.safety_complaints}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Last 7 Days</span>
                <span className="text-sm font-black text-amber-700 font-mono">
                  {proj.recent_complaints_last_7_days}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium block">Rework Orders</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {proj.rework_requests}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Contractor Performance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-700" />
              <span>Contractor Performance Evaluation (0–100)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Transparent MCDA-style rating: 30% On-time + 25% Inspection Pass + 20% Quality + 15% Complaints + 10% Safety
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Contractor</th>
                <th className="p-3">Wards</th>
                <th className="p-3 text-center">On-Time (30%)</th>
                <th className="p-3 text-center">Inspect (25%)</th>
                <th className="p-3 text-center">Quality (20%)</th>
                <th className="p-3 text-center">Complaints (15%)</th>
                <th className="p-3 text-center">Safety (10%)</th>
                <th className="p-3 text-right">Overall Score</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractors.map(c => (
                <tr key={c.contractor_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {c.contact_person} • {c.phone}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] text-slate-600">{c.wards_served.join(', ')}</span>
                  </td>
                  <td className="p-3 text-center font-mono font-semibold">
                    {c.performance.on_time_score}%
                  </td>
                  <td className="p-3 text-center font-mono font-semibold">
                    {c.performance.inspection_score}%
                  </td>
                  <td className="p-3 text-center font-mono font-semibold">
                    {c.performance.quality_score}%
                  </td>
                  <td className="p-3 text-center font-mono font-semibold">
                    {c.performance.complaint_score}%
                  </td>
                  <td className="p-3 text-center font-mono font-semibold">
                    {c.performance.safety_score}%
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-sm font-black font-mono text-slate-900">
                      {c.performance.overall_score}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.performance.score_tier === 'EXCELLENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.performance.score_tier === 'GOOD'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {c.performance.score_tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Projects List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-700" />
          <span>Municipal Public Works Portfolio</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map(p => (
            <div
              key={p.project_id}
              className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                p.cie_inspection_status === 'INSPECTION_RECOMMENDED'
                  ? 'border-red-400 bg-red-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">
                    {p.project_id} • {p.ward}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {p.asset_name}
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    p.cie_inspection_status === 'INSPECTION_RECOMMENDED'
                      ? 'bg-red-100 text-red-800 font-bold border border-red-300'
                      : p.cie_inspection_status === 'WARNING'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {p.cie_inspection_status === 'INSPECTION_RECOMMENDED'
                    ? 'INSPECT NOW'
                    : p.cie_inspection_status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Contractor: <strong className="text-slate-800">{p.contractor_name}</strong></div>
                <div>Contract Value: <strong className="text-slate-800 font-mono">₹{(p.contract_value / 100000).toFixed(1)} Lakhs</strong></div>
                <div>Status: <strong className="text-slate-800 font-mono">{p.status}</strong></div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {p.post_completion_complaints} post-handover complaints
                </span>
                <button
                  onClick={() => handleOpenInspect(p)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accountability Audit Trail */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-700" />
          <span>Immutable Quality & Accountability Audit Trail</span>
        </h2>

        <div className="space-y-2.5">
          {events.map(ev => (
            <div
              key={ev.event_id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-slate-700">{ev.event_id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-slate-900">{ev.project_id} ({ev.asset_id})</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {ev.event_type}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">{ev.evidence_summary}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-500 block">
                  Logged by: <strong>{ev.logged_by}</strong>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(ev.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record On-Site Inspection Modal */}
      {selectedProject && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`On-Site Quality Inspection: ${selectedProject.project_id}`}
          subtitle={`Evaluating asset ${selectedProject.asset_name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Asset:</span>
                <strong className="text-slate-900 font-bold">{selectedProject.asset_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contractor:</span>
                <strong className="text-slate-900 font-bold">{selectedProject.contractor_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Post-Completion Complaints:</span>
                <strong className="text-red-700 font-bold font-mono">{selectedProject.post_completion_complaints}</strong>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Inspection Outcome *
              </label>
              <select
                value={inspectionOutcome}
                onChange={e => setInspectionOutcome(e.target.value as InspectionOutcome)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="REQUIRES_REWORK">REQUIRES_REWORK — Defect found, contractor rework mandated</option>
                <option value="PASSED">PASSED — Defect within allowable standard</option>
                <option value="FAILED">FAILED — Severe non-compliance, administrative review</option>
                <option value="NO_ISSUE_FOUND">NO_ISSUE_FOUND — Complaint unverified on site</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Inspecting Officer Name *
              </label>
              <input
                type="text"
                value={officerName}
                onChange={e => setOfficerName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Inspection Notes & Directive *
              </label>
              <textarea
                value={inspectionNotes}
                onChange={e => setInspectionNotes(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                placeholder="Detail the defect observations and rectification timeline..."
                required
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Recording this outcome updates contractor quality records and automatically logs an entry in the municipal accountability ledger.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Save Inspection Outcome'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
