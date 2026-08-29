import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assignmentService } from '../../services/assignmentService';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MunicipalAssignment, CivicIssue, CivicStatus, ResolutionDetails } from '../../types';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { IssueTimeline } from '../../components/issues/IssueTimeline';
import { Modal } from '../../components/common/Modal';
import {
  Truck,
  Users,
  IndianRupee,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Check,
  ShieldCheck,
  RotateCcw,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [assignment, setAssignment] = useState<MunicipalAssignment | null>(null);
  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State for Resource Assignment
  const [selectedTeam, setSelectedTeam] = useState('Team 2 (Sanitation Rapid Squad)');
  const [selectedVehicle, setSelectedVehicle] = useState('Vehicle 2 (Hydraulic Compactor)');
  const [workersCount, setWorkersCount] = useState<number>(2);
  const [officerNotes, setOfficerNotes] = useState('');

  // Modals & Workflow States
  const [confirmAssignModalOpen, setConfirmAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Status Update & Resolution Modal State
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<CivicStatus>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('Garbage cleared from market area and hygiene spray applied.');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      const assignData = await assignmentService.getAssignment(id);
      const issueData = await issueService.getIssue(id);

      if (assignData) {
        setAssignment(assignData);
        setSelectedTeam(assignData.team);
        setSelectedVehicle(assignData.vehicle);
        setWorkersCount(assignData.workers);
      }
      if (issueData) {
        setIssue(issueData);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  // Capacity calculations
  const TOTAL_AVAILABLE_WORKERS = 18;
  const remainingWorkers = Math.max(0, TOTAL_AVAILABLE_WORKERS - workersCount);

  const handleConfirmAssignment = async () => {
    if (!id) return;
    setIsAssigning(true);
    const updated = await assignmentService.assignResources(id, {
      team: selectedTeam,
      vehicle: selectedVehicle,
      workers: workersCount,
      notes: officerNotes || undefined,
    });
    setAssignment(updated || null);
    setIsAssigning(false);
    setConfirmAssignModalOpen(false);
    setAssignSuccess(true);
    showToast('success', 'Team Dispatched', `Resource assignment confirmed for #${id}`);
  };

  const handleStatusUpdateSubmit = async () => {
    if (!assignment) return;
    setIsUpdatingStatus(true);

    if (targetStatus === 'RESOLVED') {
      await assignmentService.resolveAssignment(assignment.issue_id, {
        completion_notes: resolutionNotes,
        after_photos: [afterPhotoUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'],
      });
    } else {
      await assignmentService.updateAssignmentStatus(assignment.issue_id, targetStatus);
    }

    const updated = await assignmentService.getAssignment(assignment.issue_id);
    setAssignment(updated || null);
    setStatusUpdateModalOpen(false);
    showToast('success', 'Status Updated', `Issue #${assignment.issue_id} status changed to ${targetStatus}`);
    setIsUpdatingStatus(false);
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

  // Fallback defaults if new assignment
  const currentStatus = assignment?.status || issue?.status || 'APPROVED';
  const displayTitle = assignment?.issue_title || issue?.title || 'Civic Issue';
  const displayWard = assignment?.ward || issue?.ward || 'Ward 5';
  const displayPriority = assignment?.priority || issue?.priority_score || 87;
  const displayPriorityLevel = assignment?.priority_level || issue?.priority_level || 'CRITICAL';
  const estCost = assignment?.estimated_cost || issue?.recommendation?.estimated_cost || 8000;
  const estTime = assignment?.estimated_time || '2 hours';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/assignments')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back to assignments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium">Resource Assignments</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold text-slate-900">{id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/recommendations/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>View CIE Recommendation</span>
          </Link>

          <button
            onClick={() => setStatusUpdateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <span>Update Status / Close</span>
          </button>
        </div>
      </div>

      {/* 4. Issue Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                {id}
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                {displayWard}
              </span>
              <StatusBadge status={currentStatus} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {displayTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Authorized municipal operational deployment & verified resolution tracking
            </p>
          </div>

          {/* Priority Display */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg border sm:border-0 border-slate-200 shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                PRIORITY SCORE
              </span>
              <div className="text-3xl font-black text-slate-900 font-mono leading-none mt-0.5">
                {displayPriority}<span className="text-sm font-normal text-slate-400"> / 100</span>
              </div>
            </div>
            <PriorityBadge level={displayPriorityLevel} size="lg" />
          </div>
        </div>

        {/* 10. 7-Stage Status Timeline */}
        <div className="pt-1">
          <IssueTimeline status={currentStatus} orientation="horizontal" />
        </div>
      </div>

      {/* SUCCESS BANNER IF ASSIGNED */}
      {(assignSuccess || currentStatus === 'ASSIGNED' || currentStatus === 'IN_PROGRESS') && (
        <div className="bg-emerald-50/90 rounded-xl border-2 border-emerald-400 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-emerald-600 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 block">
                ✓ Assignment Successful & Dispatched
              </span>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                <strong>{selectedTeam.split(' (')[0]}</strong> assigned with <strong>{selectedVehicle.split(' (')[0]}</strong> and <strong>{workersCount} Workers</strong>. Status is now <strong className="text-purple-800 uppercase">{currentStatus}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStatusUpdateModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              Update Status / Resolve
            </button>
          </div>
        </div>
      )}

      {/* RESOLUTION BANNER IF RESOLVED */}
      {currentStatus === 'RESOLVED' && assignment?.resolution && (
        <div className="bg-emerald-50 rounded-xl border-2 border-emerald-500 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 block">
                ✓ Issue Marked as Resolved
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Verified Closure by Municipal Authority
              </h3>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-200 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Resolution Timestamp:</span>
                <strong className="text-slate-900">{new Date(assignment.resolution.resolved_at).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Team & Vehicle:</span>
                <strong className="text-slate-900">{assignment.team.split(' (')[0]} • {assignment.vehicle.split(' (')[0]}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Verified Officer:</span>
                <strong className="text-emerald-800 font-bold">{assignment.resolution.verified_by}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500 block text-[11px]">Completion Notes:</span>
              <p className="text-slate-800 font-medium mt-0.5">{assignment.resolution.completion_notes}</p>
            </div>
          </div>

          {assignment.resolution.after_photos && assignment.resolution.after_photos.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 block">
                Verified Resolution Photo Evidence:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                {assignment.resolution.after_photos.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-emerald-300 aspect-video bg-slate-100">
                    <img src={url} alt="After Evidence" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TWO-COLUMN DESKTOP LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 5. Recommended Resources + Issue Context (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. Recommended Resources Card */}
          <div className="bg-sky-50/80 rounded-xl border border-sky-300 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-sky-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-sky-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-950">
                  CIE Recommendation Reference
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                Authorized Spec
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              The Civic Intelligence Engine recommended the following resource allocation for optimal clearance:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-sky-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Vehicle</span>
                <span className="font-bold text-slate-900">Vehicle 2</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-sky-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Personnel</span>
                <span className="font-bold text-slate-900">2 Workers</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-sky-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Estimated Cost</span>
                <span className="font-bold text-slate-900 font-mono">₹{estCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-sky-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Estimated Time</span>
                <span className="font-bold text-slate-900">{estTime}</span>
              </div>
            </div>
          </div>

          {/* 7. Resource Availability Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Resource Availability & Capacity
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Capacity OK
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Budget */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Budget Allocation</span>
                  </span>
                  <span className="font-mono text-slate-500">Available: ₹42,000</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-red-700">Allocated: ₹{estCost.toLocaleString('en-IN')}</span>
                  <span className="text-emerald-800 font-bold">Remaining: ₹{(42000 - estCost).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Workers */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Field Workers</span>
                  </span>
                  <span className="font-mono text-slate-500">Available: 18</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-indigo-700">Allocated: {workersCount}</span>
                  <span className="text-emerald-800 font-bold">Remaining: {remainingWorkers}</span>
                </div>
              </div>

              {/* Vehicles */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-sky-700" />
                    <span>Fleet Vehicles</span>
                  </span>
                  <span className="font-mono text-slate-500">Available: 6</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-sky-700">Allocated: 1</span>
                  <span className="text-emerald-800 font-bold">Remaining: 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 6. Resource Selection Form & Execution Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-700" />
                <span>Resource Selection & Dispatch</span>
              </h2>
              <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                Officer Authorized
              </span>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs">
              {/* Team Dropdown */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Assign Sanitation / Maintenance Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={e => setSelectedTeam(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-purple-600"
                >
                  <option value="Team 1 (Drainage Maintenance Squad)">Team 1 (Drainage Maintenance Squad)</option>
                  <option value="Team 2 (Sanitation Rapid Squad)">Team 2 (Sanitation Rapid Squad)</option>
                  <option value="Team 3 (Hydraulic Pipeline Emergency)">Team 3 (Hydraulic Pipeline Emergency)</option>
                  <option value="Team 4 (Electrical Maintenance Squad)">Team 4 (Electrical Maintenance Squad)</option>
                </select>
              </div>

              {/* Vehicle Dropdown */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Assign Municipal Fleet Vehicle
                </label>
                <select
                  value={selectedVehicle}
                  onChange={e => setSelectedVehicle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-purple-600"
                >
                  <option value="Vehicle 1 (Suction Jetting Truck MH-17-DE-3041)">Vehicle 1 (Suction Jetting Truck MH-17-DE-3041)</option>
                  <option value="Vehicle 2 (Hydraulic Compactor MH-17-AZ-4102)">Vehicle 2 (Hydraulic Compactor MH-17-AZ-4102)</option>
                  <option value="Vehicle 3 (Pipeline Repair Van MH-17-BG-8819)">Vehicle 3 (Pipeline Repair Van MH-17-BG-8819)</option>
                  <option value="Vehicle 4 (Fogging Carrier MH-17-HC-2290)">Vehicle 4 (Fogging Carrier MH-17-HC-2290)</option>
                  <option value="Vehicle 5 (Bucket Ladder Van MH-17-EL-0914)">Vehicle 5 (Bucket Ladder Van MH-17-EL-0914)</option>
                </select>
              </div>

              {/* Workers Count Stepper */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Assigned Personnel Count
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={workersCount}
                    onChange={e => setWorkersCount(Math.max(1, Number(e.target.value)))}
                    className="w-28 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm"
                  />
                  <div className="text-xs text-slate-500 font-medium">
                    Available: <strong className="text-slate-900">{TOTAL_AVAILABLE_WORKERS}</strong> • Selected: <strong className="text-purple-800">{workersCount}</strong> • Remaining: <strong className="text-emerald-800">{remainingWorkers}</strong>
                  </div>
                </div>
              </div>

              {/* Officer Notes */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Dispatch Instructions / Officer Notes
                </label>
                <textarea
                  rows={2}
                  value={officerNotes}
                  onChange={e => setOfficerNotes(e.target.value)}
                  placeholder="Enter specific safety directives or ward contact instructions..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 font-medium">
                  Officer approves — Officer assigns. Human authorization gate is mandatory.
                </p>

                <button
                  type="button"
                  onClick={() => setConfirmAssignModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Truck className="w-4 h-4" />
                  <span>ASSIGN TEAM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. ASSIGNMENT CONFIRMATION MODAL */}
      <Modal
        isOpen={confirmAssignModalOpen}
        onClose={() => setConfirmAssignModalOpen(false)}
        title="Confirm Resource Assignment"
        subtitle="Review and dispatch municipal team and vehicle"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Issue:</span>
              <strong className="text-slate-900 font-bold">{displayTitle} — {displayWard}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority:</span>
              <strong className="text-red-700 font-bold font-mono">
                {displayPriority} — {displayPriorityLevel}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Team:</span>
              <strong className="text-slate-900 font-bold">{selectedTeam.split(' (')[0]}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Vehicle:</span>
              <strong className="text-slate-900 font-bold">{selectedVehicle.split(' (')[0]}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Workers:</span>
              <strong className="text-slate-900 font-bold font-mono">{workersCount} Personnel</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
              <span className="text-slate-700">Estimated Cost:</span>
              <span className="text-slate-900 font-mono">₹{estCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Confirming this assignment will dispatch the selected field squad, lock the fleet vehicle, and advance the issue status to ASSIGNED.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmAssignModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirmAssignment}
              disabled={isAssigning}
              className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm cursor-pointer"
            >
              {isAssigning ? 'Dispatching...' : 'CONFIRM ASSIGNMENT'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 11 & 12. UPDATE STATUS & RESOLUTION EVIDENCE MODAL */}
      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title={`Update Status for #${id}`}
        subtitle="Advance operational lifecycle or record verified resolution"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Target Operational Stage</label>
            <select
              value={targetStatus}
              onChange={e => setTargetStatus(e.target.value as CivicStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            >
              <option value="ASSIGNED">ASSIGNED (Team dispatched)</option>
              <option value="IN_PROGRESS">IN PROGRESS (Work currently underway)</option>
              <option value="RESOLVED">RESOLVED (Work complete & verified)</option>
            </select>
          </div>

          {/* 12. RESOLUTION EVIDENCE UI */}
          {targetStatus === 'RESOLVED' && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
              <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Resolution Evidence & Closure Verification</span>
              </h4>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Garbage cleared from market area..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {/* Photo Evidence (Before + After) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Before Photo (Submitted)</span>
                  <div className="rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-100">
                    <img
                      src={assignment?.before_photo || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block mb-1">After Photo (Verified Site)</span>
                  <div className="rounded-lg overflow-hidden border border-emerald-400 aspect-video bg-emerald-100 relative">
                    <img
                      src={afterPhotoUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-emerald-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      After Evidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusUpdateModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusUpdateSubmit}
              disabled={isUpdatingStatus}
              className={`px-5 py-2 font-bold text-white rounded-lg shadow-sm cursor-pointer ${
                targetStatus === 'RESOLVED'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-purple-700 hover:bg-purple-800'
              }`}
            >
              {isUpdatingStatus ? 'Saving...' : targetStatus === 'RESOLVED' ? 'MARK AS RESOLVED' : 'CONFIRM STATUS UPDATE'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
