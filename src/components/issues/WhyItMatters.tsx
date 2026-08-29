import React from 'react';
import { Check, ShieldAlert } from 'lucide-react';

interface WhyItMattersProps {
  rationales: string[];
}

export const WhyItMatters: React.FC<WhyItMattersProps> = ({ rationales }) => {
  if (!rationales || rationales.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-sky-600" />
        <span>Why This Issue Matters</span>
      </h2>
      <p className="text-xs text-slate-500 font-medium">
        Civic intelligence evaluation highlights why immediate officer attention is required:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {rationales.map((rationale, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed"
          >
            <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>{rationale}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
