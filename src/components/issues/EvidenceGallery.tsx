import React from 'react';
import { Camera, MapPin, Calendar, CheckCircle } from 'lucide-react';

interface EvidenceGalleryProps {
  beforePhotos: string[];
  afterPhotos?: string[];
  submittedAt: string;
  address: string;
  resolvedAt?: string;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  beforePhotos,
  afterPhotos,
  submittedAt,
  address,
  resolvedAt,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-sky-600" />
          <span>Photographic Evidence & Verification</span>
        </h2>
        <span className="text-[11px] text-slate-400 font-mono">
          {beforePhotos.length + (afterPhotos?.length || 0)} Media Attachments
        </span>
      </div>

      {/* Submitted Photos */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 block">
          Submitted Field Photos
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {beforePhotos.map((url, i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
            >
              <img
                src={url}
                alt={`Evidence ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                  Submitted Photo #{i + 1}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-1">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{address}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Resolution Photos (if available) */}
      {afterPhotos && afterPhotos.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Post-Resolution Verified Photos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {afterPhotos.map((url, i) => (
              <div
                key={i}
                className="group relative rounded-xl overflow-hidden border border-emerald-300 aspect-video bg-emerald-50"
              >
                <img
                  src={url}
                  alt={`Resolution ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950/90 to-transparent p-3 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                    Verified Resolution #{i + 1}
                  </span>
                  {resolvedAt && (
                    <div className="text-[10px] text-emerald-200 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(resolvedAt).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
