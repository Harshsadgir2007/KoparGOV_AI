import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CivicIssue } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  FileCheck,
  AlertOctagon,
  Image as ImageIcon,
  EyeOff,
  User,
} from 'lucide-react';

const citizenMarkerIcon = L.divIcon({
  className: 'custom-citizen-marker',
  html: `
    <div style="
      background-color: #0284C7;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); color: #FFFFFF; font-size: 14px;">📍</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export const CitizenTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (id) {
        const item = await citizenService.getIssue(id);
        if (item) setIssue(item);
      } else {
        const myIssues = await citizenService.getMyIssues();
        if (myIssues.length > 0) {
          setIssue(myIssues[0]);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-slate-400">
        <p className="text-sm font-semibold">Loading complaint tracking details...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
        <AlertOctagon className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">
          {id ? (
            <>The complaint ID <strong className="font-mono">{id}</strong> does not exist in our database.</>
          ) : (
            <>No complaints found to track. Submit a new report to start tracking.</>
          )}
        </p>
        <Link
          to="/citizen/issues"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 text-white font-bold rounded-xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>
      </div>
    );
  }

  // 14. Citizen-Friendly Status Stages
  const isPendingRecovery = issue.status === 'PENDING_RECOVERY';
  const stages = [
    { label: 'Complaint Submitted', done: true, desc: 'Logged with Kopargaon Municipal Council' },
    { label: 'Information Validated', done: !isPendingRecovery, desc: 'Civic category & ward verified' },
    { label: 'Priority Assessed', done: !isPendingRecovery, desc: 'CIE multi-criteria urgency evaluation' },
    { label: 'Officer Approved', done: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(issue.status), desc: 'Municipal officer authorization' },
    { label: 'Team Assigned', done: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(issue.status), desc: 'Sanitation squad & vehicle dispatched' },
    { label: 'Work In Progress', done: ['IN_PROGRESS', 'RESOLVED'].includes(issue.status), desc: 'Ground crew active on site' },
    { label: 'Resolved', done: issue.status === 'RESOLVED', desc: 'Verified public closure' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Queued in Recovery Mode Notice */}
      {isPendingRecovery && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 space-y-1.5 animate-pulse">
          <div className="flex items-center gap-2 font-black">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>QUEUED IN RECOVERY OPERATION JOURNAL (Op #{issue.operation_id || 'OP-QUEUED'})</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            This complaint was received while municipal primary data stores were in degraded resilience mode. It has been safely recorded in immutable append-only memory and will be committed when data services are restored.
          </p>
        </div>
      )}

      {/* 13. Complaint Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/citizen/issues"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Complaints</span>
          </Link>
          <StatusBadge status={issue.status} size="md" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {issue.id}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {issue.ward}
            </span>
            <span className="text-xs text-slate-500">
              Submitted: {new Date(issue.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight pt-1">
            {issue.title}
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {issue.description}
          </p>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs flex-wrap">
            <span className="text-slate-500 font-medium">Reported by:</span>
            <span className="font-bold text-slate-900">
              {issue.is_anonymous ? 'Anonymous Citizen' : (issue.reporter_display_name || issue.citizen_name || 'Anonymous Citizen')}
            </span>
            {issue.is_anonymous ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                <EyeOff className="w-3 h-3 text-slate-500" />
                <span>Identity Protected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                <User className="w-3 h-3 text-sky-600" />
                <span>Public Report</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 14. Status Timeline Component */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-700" />
          <span>Resolution Progress Timeline</span>
        </h2>

        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    stage.done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {stage.done ? '✓' : idx + 1}
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className={`w-0.5 h-6 my-1 ${
                      stage.done ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              <div className="pt-0.5">
                <p className={`font-bold text-xs ${stage.done ? 'text-slate-900' : 'text-slate-400'}`}>
                  {stage.label}
                </p>
                <p className="text-[11px] text-slate-500">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 15. Citizen-Friendly Explanation */}
      <div className="bg-sky-50 rounded-2xl border border-sky-200 p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sky-700" />
          <span>Why is this being prioritized?</span>
        </div>
        <p className="text-xs text-sky-950 font-medium leading-relaxed">
          Your complaint has a high priority because it affects a large number of people ({issue.population_affected} residents in this zone) and has a potential health and safety impact.
        </p>
      </div>

      {/* 16. Municipal Assignment Info (if assigned / in progress / resolved) */}
      {['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(issue.status) && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-700" />
            <span>Assigned Field Resources</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Assigned Team</span>
              <strong className="text-slate-900 font-bold">Municipal Team 2</strong>
              <span className="text-[10px] text-slate-500 block">Sanitation Rapid Unit</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Expected Response</span>
              <strong className="text-emerald-700 font-bold">Today</strong>
              <span className="text-[10px] text-slate-500 block">Within 2 hours</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Fleet Vehicle</span>
              <strong className="text-purple-900 font-bold">Vehicle 2</strong>
              <span className="text-[10px] text-slate-500 block">Hydraulic Compactor</span>
            </div>
          </div>
        </div>
      )}

      {/* 17. Resolution Details (if resolved) */}
      {issue.status === 'RESOLVED' && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-300 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-950">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Issue Resolved Successfully
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Resolution Date</span>
              <p className="font-bold text-slate-900">
                {new Date(issue.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase">Verification Note</span>
              <p className="text-slate-800 font-medium">
                Waste clearance complete and sanitized by Municipal Team 2.
              </p>
            </div>
          </div>

          {/* Before & After Photo Evidence */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-100">
              <img
                src={issue.before_photos[0] || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'}
                alt="Before"
                className="w-full h-28 sm:h-36 object-cover"
              />
              <p className="text-[10px] font-bold text-center py-1 bg-slate-900 text-white">BEFORE</p>
            </div>

            <div className="rounded-xl overflow-hidden border border-emerald-400 bg-emerald-100">
              <img
                src={issue.after_photos?.[0] || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'}
                alt="After"
                className="w-full h-28 sm:h-36 object-cover"
              />
              <p className="text-[10px] font-bold text-center py-1 bg-emerald-700 text-white">AFTER (CLEARED)</p>
            </div>
          </div>
        </div>
      )}

      {/* Geocoded Location Map */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-700" />
          <span>Reported Location</span>
        </h2>
        <p className="text-xs text-slate-600">{issue.address}</p>

        <div className="h-48 rounded-xl overflow-hidden border border-slate-200">
          <MapContainer
            center={issue.coordinates}
            zoom={15}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={issue.coordinates} icon={citizenMarkerIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong>{issue.id}</strong>
                  <p>{issue.address}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
