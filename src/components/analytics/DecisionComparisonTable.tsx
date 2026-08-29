import React from 'react';
import { Scale, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface DecisionComparisonTableProps {
  comparison: {
    metric: string;
    traditional_fcfs: string;
    cie_approach: string;
    improvement: string;
  }[];
}

export const DecisionComparisonTable: React.FC<DecisionComparisonTableProps> = ({
  comparison,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <span>Decision Approach Comparison</span>
            </h2>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Research Benchmark
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Evaluating traditional first-come-first-served (FCFS) triage vs. CIE resource-aware multi-criteria optimization
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Synthetic / Demo Evaluation Data
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Evaluation Metric</th>
              <th className="py-3 px-4 text-slate-500">Traditional FCFS Baseline</th>
              <th className="py-3 px-4 text-sky-950 font-bold bg-sky-50/50">CIE Resource-Aware Approach</th>
              <th className="py-3 px-4 text-right">Demonstrated Improvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {comparison.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/90 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {row.metric}
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-mono">
                  {row.traditional_fcfs}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-sky-950 bg-sky-50/30">
                  {row.cie_approach}
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>{row.improvement}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-900 font-semibold">Research Note: </strong>
          The comparison benchmarks demonstrate that resource-aware multi-criteria prioritization resolves high-hazard public safety emergencies twice as fast while preventing municipal budget and personnel starvation.
        </span>
      </div>
    </div>
  );
};
