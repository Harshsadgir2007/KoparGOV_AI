import React from 'react';
import { Check, Info } from 'lucide-react';

interface WhyCIERecommendsProps {
  reasons: string[];
}

export const WhyCIERecommends: React.FC<WhyCIERecommendsProps> = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <div className="p-1 rounded-md bg-sky-100 text-sky-700">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Why CIE recommends this action
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Algorithmic decision rationale derived from civic priority & resource constraints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {reasons.map((reason, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed"
          >
            <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>{reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
