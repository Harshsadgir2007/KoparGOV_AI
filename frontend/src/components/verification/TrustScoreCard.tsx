import React from 'react';
import { VerificationResult, VerificationStatus } from '../../types/verification';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';

interface TrustScoreCardProps {
  verification: VerificationResult;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ verification }) => {
  const { trust_score, verification_status, requires_officer_review, verification_reasons, manual_override, overridden_by, override_notes } = verification;

  // Status configuration
  const statusConfig: Record<VerificationStatus, {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
    barColor: string;
    badgeBg: string;
  }> = {
    VERIFIED: {
      label: 'VERIFIED / HIGH CONFIDENCE',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      barColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    NEEDS_REVIEW: {
      label: 'NEEDS OFFICER REVIEW',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
      barColor: 'bg-amber-500',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    UNVERIFIED: {
      label: 'UNVERIFIED / LOW CONFIDENCE',
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      icon: <ShieldX className="w-5 h-5 text-rose-400" />,
      barColor: 'bg-rose-500',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
  };

  const config = statusConfig[verification_status] || statusConfig.NEEDS_REVIEW;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Civic Trust & Verification Layer
            </h2>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Civic Trust Status:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${config.badgeBg}`}>
                {verification_status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {manual_override && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-950 text-sky-300 px-2.5 py-1 rounded border border-sky-800">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Officer Overridden ({overridden_by || 'Verified'})</span>
          </span>
        )}
      </div>

      {/* Trust Score & Progress Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
        <div className="sm:col-span-4 text-center sm:text-left">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
            Computed Trust Score
          </span>
          <div className="flex items-baseline gap-1 mt-0.5 justify-center sm:justify-start">
            <span className={`text-4xl font-black font-mono leading-none ${config.text}`}>
              {trust_score.toFixed(0)}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">/ 100</span>
          </div>
          <span className={`text-[11px] font-bold block mt-1 ${config.text}`}>
            {config.label}
          </span>
        </div>

        <div className="sm:col-span-8 space-y-2">
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
              style={{ width: `${Math.max(5, Math.min(100, trust_score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold px-0.5">
            <span>0 (Low Confidence)</span>
            <span>50 (Review Threshold)</span>
            <span>80 (Verified)</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Prominent NEEDS_REVIEW Alert */}
      {verification_status === 'NEEDS_REVIEW' && (
        <div className="bg-amber-950/50 border-l-4 border-amber-500 p-3.5 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-amber-200">
              Officer verification required before treating this information as confirmed.
            </p>
            <p className="text-amber-300/80 leading-relaxed text-[11px]">
              This complaint requires physical ground inspection or corroborating verification before municipal work orders are sanctioned.
            </p>
          </div>
        </div>
      )}

      {/* Transparent Reasons */}
      {verification_reasons && verification_reasons.length > 0 && (
        <div className="space-y-1.5 pt-1 text-xs">
          <span className="text-[11px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
            Deterministic Decision Rationale
          </span>
          <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            {verification_reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px] leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
            {override_notes && (
              <div className="text-sky-300 font-medium text-[11px] pt-1 border-t border-slate-800">
                <span className="font-bold">Officer Note:</span> {override_notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
