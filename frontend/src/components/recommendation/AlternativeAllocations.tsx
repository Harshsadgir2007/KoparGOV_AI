import React from 'react';
import { CIEAlternativeOption } from '../../types';
import { Layers, CheckCircle2, IndianRupee } from 'lucide-react';

interface AlternativeAllocationsProps {
  alternatives: CIEAlternativeOption[];
  selectedOptionId?: string;
  onSelectOption?: (id: string) => void;
}

export const AlternativeAllocations: React.FC<AlternativeAllocationsProps> = ({
  alternatives,
  selectedOptionId,
  onSelectOption,
}) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Alternative Allocations</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Multi-scenario evaluation generated under current municipal constraints
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {alternatives.length} Scenarios Evaluated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alternatives.map(opt => {
          const isSelected = selectedOptionId ? selectedOptionId === opt.id : opt.is_recommended;

          return (
            <div
              key={opt.id}
              onClick={onSelectOption ? () => onSelectOption(opt.id) : undefined}
              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                opt.is_recommended
                  ? 'bg-sky-50/60 border-sky-400 ring-1 ring-sky-300 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              } ${onSelectOption ? 'cursor-pointer' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    {opt.name}
                  </span>
                  {opt.is_recommended && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-sky-700 text-white px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Recommended</span>
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-800 leading-snug">
                  {opt.action}
                </p>

                {opt.notes && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {opt.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost:</span>
                  <span className="font-mono font-bold text-slate-900">₹{opt.cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Civic Benefit:</span>
                  <span className={`font-semibold ${opt.benefit === 'High' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {opt.benefit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resource Impact:</span>
                  <span className={`font-semibold ${opt.resource_impact === 'Low' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {opt.resource_impact}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
