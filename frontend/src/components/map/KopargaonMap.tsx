import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CivicIssue } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Truck, Users, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

// Fix for default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Priority Markers with Color Coding & Score Badge
const createPriorityMarker = (priority: string, score: number) => {
  const color = {
    CRITICAL: '#DC2626',
    HIGH: '#EA580C',
    MEDIUM: '#D97706',
    LOW: '#16A34A',
  }[priority] || '#0284C7';

  const html = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 8px -1px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <span style="
        transform: rotate(45deg);
        color: #FFFFFF;
        font-weight: 900;
        font-size: 11px;
        font-family: ui-monospace, monospace;
        letter-spacing: -0.5px;
      ">${score}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-priority-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Resource/Fleet Marker
const createFleetMarker = (label: string, type: 'vehicle' | 'team') => {
  const bgColor = type === 'vehicle' ? '#7C3AED' : '#0369A1';
  const iconText = type === 'vehicle' ? '🚛' : '👷';

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    ">
      <span>${iconText}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-fleet-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Project & Contractor Inspection Marker
const createProjectMarker = (status: string) => {
  const isFlagged = status === 'INSPECTION_RECOMMENDED';
  const bgColor = isFlagged ? '#DC2626' : '#0284C7';

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      cursor: pointer;
      ${isFlagged ? 'animation: pulse 2s infinite;' : ''}
    ">
      <span>🏗️</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-project-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to handle map re-centering
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

interface KopargaonMapProps {
  issues: CivicIssue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  compact?: boolean;
  showResources?: boolean;
  showProjects?: boolean;
}

// Synthetic Fleet / Team Locations in Kopargaon
const MOCK_FLEET_RESOURCES = [
  { id: 'FL-1', name: 'Hydraulic Compactor (MH-17-AZ-4102)', type: 'vehicle' as const, pos: [19.8925, 74.4770] as [number, number], status: 'Active at Market Yard' },
  { id: 'FL-2', name: 'Suction Jetting Truck (MH-17-DE-3041)', type: 'vehicle' as const, pos: [19.8950, 74.4740] as [number, number], status: 'En route Subhash Nagar' },
  { id: 'FL-3', name: 'Sanitation Rapid Unit 1', type: 'team' as const, pos: [19.8910, 74.4795] as [number, number], status: '3 Personnel deployed' },
  { id: 'FL-4', name: 'Drainage Squad', type: 'team' as const, pos: [19.8935, 74.4760] as [number, number], status: '4 Personnel deployed' },
];

const MOCK_PROJECTS_LAYER = [
  {
    id: 'PRJ-024',
    name: 'Ward 5 Market Road (Resurfacing)',
    contractor: 'ABC Infrastructure & Roadways',
    pos: [19.8917, 74.4789] as [number, number],
    status: 'INSPECTION_RECOMMENDED',
    complaints: 17,
  },
  {
    id: 'PRJ-019',
    name: 'Ward 3 Subhash Road Feeder Pipeline',
    contractor: 'Godavari Civil Engineers',
    pos: [19.8942, 74.4721] as [number, number],
    status: 'NORMAL',
    complaints: 2,
  },
  {
    id: 'PRJ-031',
    name: 'Ward 1 Tilak Road LED Streetlight Grid',
    contractor: 'Mahalaxmi Electricals',
    pos: [19.8876, 74.4812] as [number, number],
    status: 'WARNING',
    complaints: 4,
  },
];

export const KopargaonMap: React.FC<KopargaonMapProps> = ({
  issues,
  height = '600px',
  center = [19.8917, 74.4789],
  zoom = 14,
  compact = false,
  showResources = false,
  showProjects = true,
}) => {
  return (
    <div style={{ height }} className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={!compact}
        className="w-full h-full"
        style={{ minHeight: height }}
      >
        <ChangeView center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Civic Issue Markers */}
        {issues.map(issue => (
          <Marker
            key={issue.id}
            position={issue.coordinates}
            icon={createPriorityMarker(issue.priority_level, issue.priority_score)}
          >
            {/* 5. Marker Popup matching exact specification */}
            <Popup className="custom-issue-popup">
              <div className="p-1.5 min-w-[240px] max-w-xs space-y-2 text-xs">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-xs">{issue.id}</span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                      {issue.ward.split(' - ')[0]}
                    </span>
                  </div>
                  <PriorityBadge level={issue.priority_level} size="sm" />
                </div>

                {/* Title */}
                <h4 className="font-bold text-slate-900 leading-snug line-clamp-2">
                  {issue.title}
                </h4>

                {/* Priority & Category & Status */}
                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority:</span>
                    <strong className="text-red-700 font-bold font-mono">
                      {issue.priority_score} — {issue.priority_level}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-800">{issue.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                </div>

                {/* Primary Action: VIEW ISSUE */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <Link
                    to={`/issues/${issue.id}`}
                    className="w-full text-center py-1.5 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs inline-flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>VIEW ISSUE</span>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Optional Fleet / Resource Layer */}
        {showResources &&
          MOCK_FLEET_RESOURCES.map(res => (
            <Marker
              key={res.id}
              position={res.pos}
              icon={createFleetMarker(res.name, res.type)}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1 min-w-[180px]">
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <span>{res.type === 'vehicle' ? '🚛 Fleet Vehicle' : '👷 Field Team'}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{res.name}</p>
                  <p className="text-[11px] text-slate-500">{res.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Optional Municipal Public Works & Contractor Layer */}
        {(showProjects ?? true) &&
          MOCK_PROJECTS_LAYER.map(prj => (
            <Marker
              key={prj.id}
              position={prj.pos}
              icon={createProjectMarker(prj.status)}
            >
              <Popup className="custom-project-popup">
                <div className="p-1.5 min-w-[240px] max-w-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-200">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      🏗️ {prj.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prj.status === 'INSPECTION_RECOMMENDED'
                          ? 'bg-red-100 text-red-800 font-bold border border-red-300'
                          : prj.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {prj.status === 'INSPECTION_RECOMMENDED' ? 'INSPECT NOW' : prj.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 leading-snug">{prj.name}</h4>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">Contractor: </span>
                      <strong className="text-slate-800">{prj.contractor}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Post-Handover Complaints: </span>
                      <strong className="text-red-700 font-mono font-bold">{prj.complaints}</strong>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      to="/contractors"
                      className="w-full text-center py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1"
                    >
                      <span>CONTRACTOR QUALITY AUDIT</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};
