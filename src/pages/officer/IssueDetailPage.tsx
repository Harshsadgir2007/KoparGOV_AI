import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { useToast } from '../../context/ToastContext';
import { CivicIssue, CivicStatus } from '../../types';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { IssueTimeline } from '../../components/issues/IssueTimeline';
import { CIEFactorsBreakdown } from '../../components/issues/CIEFactorsBreakdown';
import { WhyItMatters } from '../../components/issues/WhyItMatters';
import { EvidenceGallery } from '../../components/issues/EvidenceGallery';
import { KopargaonMap } from '../../components/map/KopargaonMap';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Truck,
  Edit,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<CivicStatus>('PRIORITIZED');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      const data = await issueService.getIssue(id);
      if (data) {
        setIssue(data);
        setSelectedNewStatus(data.status);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleStatusChange = async () => {
    if (!issue) return;
    const updated = await issueService.updateIssueStatus(issue.id, selectedNewStatus);
    if (updated) {
      setIssue(updated);
      setStatusModalOpen(false);
      showToast('success', 'Status Updated', `Issue #${issue.id} status changed to ${selectedNewStatus}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6 bg-white rounded-xl border border-slate-200">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="h-64 bg-slate-100 rounded-xl"></div>
          <div className="h-64 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Issue Not Found</h2>
        <p className="text-xs text-slate-500">The civic issue with reference #{id} could not be located.</p>
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white font-bold rounded-lg text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Issues Registry</span>
        </Link>
      </div>
    );
  }

  // Default mock rationales if not in object
  const rationales = issue.recommendation?.rationales || [
    'High public health hazard index due to immediate site exposure',
    `${issue.population_affected.toLocaleString('en-IN')} citizens in direct radius`,
    `Unresolved for ${issue.age_days} days with rising community escalation`,
    `Located in high-sensitivity zone near ${issue.ward}`
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Nav Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/issues')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back to issues list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium">Civic Issues</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold text-slate-900">{issue.id}</span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Update Status</span>
          </button>

          <Link
            to={`/recommendations?issue=${issue.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>View CIE Recommendation</span>
          </Link>
        </div>
      </div>

      {/* 4. Main Issue Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                {issue.id}
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                {issue.category}
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                {issue.ward}
              </span>
              <StatusBadge status={issue.status} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {issue.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{issue.address}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted: {new Date(issue.submitted_at).toLocaleString('en-IN')}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Complaint Age: {issue.age_days === 0 ? 'Today' : `${issue.age_days} days`}</span>
              </span>
            </div>
          </div>

          {/* Prominent Priority Score Display */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-lg border sm:border-0 border-slate-200 shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                CIE PRIORITY
              </span>
              <div className="text-3xl font-black text-slate-900 font-mono leading-none mt-0.5">
                {issue.priority_score}<span className="text-sm font-normal text-slate-400"> / 100</span>
              </div>
            </div>
            <PriorityBadge level={issue.priority_level} size="lg" />
          </div>
        </div>

        {/* 10. Status Timeline */}
        <div className="pt-2">
          <IssueTimeline status={issue.status} orientation="horizontal" />
        </div>
      </div>

      {/* TWO-COLUMN DESKTOP LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 5. Issue Information + 8. CIE Priority Analysis + 9. Why This Issue Matters (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 5. Issue Information Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Issue Information & Description</span>
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                Simulated Operational Record
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Official Description</span>
                <p className="text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                  {issue.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Issue Reference ID</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{issue.id}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Department Category</span>
                  <span className="font-bold text-slate-900 text-xs">{issue.category}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Ward Jurisdiction</span>
                  <span className="font-bold text-slate-900 text-xs">{issue.ward}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Population In Direct Impact</span>
                  <span className="font-bold text-slate-900 text-xs">{issue.population_affected.toLocaleString('en-IN')} Citizens</span>
                </div>
              </div>
            </div>
          </div>

          {/* 8. CIE Priority Analysis Section (Six Backend-Provided Factors) */}
          <CIEFactorsBreakdown
            score={issue.priority_score}
            level={issue.priority_level}
            factors={issue.factors}
            populationAffected={issue.population_affected}
            ageDays={issue.age_days}
          />

          {/* 9. Why This Issue Matters Section */}
          <WhyItMatters rationales={rationales} />
        </div>

        {/* RIGHT COLUMN: 6. Location + 7. Evidence + 11. Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 11. Officer Actions Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Officer Actions & Workflow
            </h2>
            <div className="space-y-2">
              <Link
                to={`/recommendations?issue=${issue.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>View CIE Recommendation &rarr;</span>
              </Link>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to={`/recommendations?issue=${issue.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs border border-slate-300 transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-sky-700" />
                  <span>Approve</span>
                </Link>

                <Link
                  to={`/assignments?issue=${issue.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs border border-slate-300 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-purple-700" />
                  <span>Assign</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 6. Location Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>Geocoded Location</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {issue.coordinates[0].toFixed(4)}°N, {issue.coordinates[1].toFixed(4)}°E
              </span>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-semibold text-slate-800">{issue.address}</p>
              <p className="text-slate-500">{issue.ward}</p>
            </div>

            <div className="rounded-lg overflow-hidden border border-slate-200">
              <KopargaonMap issues={[issue]} height="220px" compact={true} />
            </div>
          </div>

          {/* 7. Evidence Gallery Section */}
          <EvidenceGallery
            beforePhotos={issue.before_photos}
            afterPhotos={issue.resolution?.after_photos}
            submittedAt={issue.submitted_at}
            address={issue.address}
            resolvedAt={issue.resolution?.resolved_at}
          />
        </div>
      </div>

      {/* UPDATE STATUS MODAL (MOCK WORKFLOW) */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Update Status for #${issue.id}`}
        subtitle="Select a new operational stage for this civic issue"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Select Status</label>
            <select
              value={selectedNewStatus}
              onChange={e => setSelectedNewStatus(e.target.value as CivicStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            >
              <option value="REPORTED">REPORTED (Initial log)</option>
              <option value="VALIDATED">VALIDATED (Geo-verified)</option>
              <option value="PRIORITIZED">PRIORITIZED (CIE Evaluated)</option>
              <option value="APPROVED">APPROVED (Authorized)</option>
              <option value="ASSIGNED">ASSIGNED (Team dispatched)</option>
              <option value="IN_PROGRESS">IN PROGRESS (Work ongoing)</option>
              <option value="RESOLVED">RESOLVED (Completed & verified)</option>
            </select>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Changing status updates the issue across all officer queues and reflects on the citizen tracking timeline.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusChange}
              className="px-5 py-2 font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
            >
              Save Status
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
