import React from 'react';
import { CivicStatus } from '../../types';
import { Check, Circle, Clock } from 'lucide-react';

interface IssueTimelineProps {
  status: CivicStatus;
  orientation?: 'horizontal' | 'vertical';
}

interface TimelineStep {
  id: CivicStatus;
  label: string;
  subtext: string;
}

const STAGES: TimelineStep[] = [
  { id: 'REPORTED', label: 'REPORTED', subtext: 'Citizen logged with evidence' },
  { id: 'VALIDATED', label: 'VALIDATED', subtext: 'Geo-verified & deduplicated' },
  { id: 'PRIORITIZED', label: 'PRIORITIZED', subtext: 'CIE multi-criteria score generated' },
  { id: 'APPROVED', label: 'APPROVED', subtext: 'Municipal officer authorized' },
  { id: 'ASSIGNED', label: 'ASSIGNED', subtext: 'Team & vehicle dispatched' },
  { id: 'IN_PROGRESS', label: 'IN PROGRESS', subtext: 'Field work underway' },
  { id: 'RESOLVED', label: 'RESOLVED', subtext: 'Work completed & verified' },
];

export const IssueTimeline: React.FC<IssueTimelineProps> = ({
  status,
  orientation = 'horizontal',
}) => {
  const getStageIndex = (s: CivicStatus): number => {
    return STAGES.findIndex(stage => stage.id === s);
  };

  const currentIndex = getStageIndex(status);

  if (orientation === 'vertical') {
    return (
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={stage.id} className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 border-white text-white shadow-xs'
                    : isCurrent
                    ? 'bg-sky-600 border-white text-white ring-2 ring-sky-300 ring-offset-1'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : isCurrent ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> : <Circle className="w-2.5 h-2.5 text-slate-300" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isCompleted
                        ? 'text-slate-800'
                        : isCurrent
                        ? 'text-sky-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-semibold">
                      Current Stage
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] mt-0.5 ${
                    isCompleted || isCurrent ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {stage.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div
              key={stage.id}
              className={`p-3 rounded-lg border text-center transition-all ${
                isCompleted
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                  : isCurrent
                  ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold ring-1 ring-sky-400 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isCompleted ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : isCurrent ? (
                  <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    ●
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
                    ○
                  </span>
                )}
                <span className="text-[10px] font-mono opacity-75">0{idx + 1}</span>
              </div>
              <div className="text-xs font-bold truncate">{stage.label}</div>
              <div className="text-[10px] opacity-75 truncate mt-0.5 hidden sm:block">
                {isCompleted ? 'Completed' : isCurrent ? 'Active Now' : 'Upcoming'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
