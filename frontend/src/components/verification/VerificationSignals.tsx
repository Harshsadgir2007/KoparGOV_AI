import React from 'react';
import { VerificationSignal, SignalSeverity } from '../../types/verification';
import {
  FileText,
  Zap,
  MapPin,
  Camera,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface VerificationSignalsProps {
  signals: VerificationSignal[];
}

export const VerificationSignals: React.FC<VerificationSignalsProps> = ({ signals }) => {
  // Map signal names to descriptive titles and icons
  const getSignalMeta = (name: string) => {
    switch (name) {
      case 'EVIDENCE_PRESENT':
        return {
          title: 'Evidence Completeness',
          icon: <Camera className="w-4 h-4 text-sky-400" />,
        };
      case 'SIMILAR_REPORTS':
        return {
          title: 'Similar Complaint Registry',
          icon: <FileText className="w-4 h-4 text-indigo-400" />,
        };
      case 'SUBMISSION_BURST':
        return {
          title: 'Submission Burst Analysis',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
        };
      case 'LOCATION_CLUSTER':
        return {
          title: 'Location & Ward Clustering',
          icon: <MapPin className="w-4 h-4 text-emerald-400" />,
        };
      case 'INDEPENDENT_CONFIRMATION':
        return {
          title: 'Independent Citizen Corroboration',
          icon: <Users className="w-4 h-4 text-cyan-400" />,
        };
      default:
        return {
          title: name.replace('_', ' '),
          icon: <Info className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const getSeverityBadge = (severity: SignalSeverity, scoreImpact: number) => {
    switch (severity) {
      case 'POSITIVE':
        return {
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          impactBadge: 'text-emerald-400 bg-emerald-950 border-emerald-800',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'WARNING':
      case 'CRITICAL':
        return {
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          impactBadge: 'text-amber-400 bg-amber-950 border-amber-800',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          impactBadge: 'text-slate-400 bg-slate-900 border-slate-800',
          icon: <Info className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  if (!signals || signals.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3.5 text-white">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
          Deterministic Verification Signals
        </h3>
        <span className="text-[10px] font-mono text-slate-500 font-semibold">
          5 Core Verification Vectors
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {signals.map((signal, index) => {
          const meta = getSignalMeta(signal.name);
          const style = getSeverityBadge(signal.severity, signal.score_impact);

          return (
            <div
              key={index}
              className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-800/80 shrink-0">
                    {meta.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {meta.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${style.badge}`}
                  >
                    {style.icon}
                    <span>{signal.severity}</span>
                  </span>

                  <span
                    className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${style.impactBadge}`}
                  >
                    {signal.score_impact > 0
                      ? `+${signal.score_impact.toFixed(0)} pts`
                      : signal.score_impact < 0
                      ? `${signal.score_impact.toFixed(0)} pts`
                      : 'Neutral'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pl-7">
                {signal.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
