import React, { useState, useEffect, useCallback } from 'react';
import { useCivic } from '../../context/CivicContext';
import { cieService, transformCivicIssueToBackend, transformResourcesToBackend } from '../../services/cieService';
import { CIEScenarioResponse, CivicIssue } from '../../types';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Users,
  IndianRupee,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ScenarioSimulationPage: React.FC = () => {
  const { issues, resources, loading: contextLoading } = useCivic();

  // Baseline Resource State
  const defaultBudget = resources?.available_budget || 340000;
  const defaultWorkers = resources?.available_workers || 18;
  const defaultVehicles = resources?.available_vehicles || 5;
  const defaultTime = 40;

  // Scenario Slider State
  const [scenarioBudget, setScenarioBudget] = useState<number>(defaultBudget);
  const [scenarioWorkers, setScenarioWorkers] = useState<number>(defaultWorkers);
  const [scenarioVehicles, setScenarioVehicles] = useState<number>(defaultVehicles);
  const [scenarioTime, setScenarioTime] = useState<number>(defaultTime);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<CIEScenarioResponse | null>(null);
  const [activePreset, setActivePreset] = useState<string>('BASELINE');

  // Sync initial resources when context loads
  useEffect(() => {
    if (resources) {
      setScenarioBudget(resources.available_budget);
      setScenarioWorkers(resources.available_workers);
      setScenarioVehicles(resources.available_vehicles);
    }
  }, [resources]);

  const runSimulation = useCallback(
    async (
      overrideBudget?: number,
      overrideWorkers?: number,
      overrideVehicles?: number,
      overrideTime?: number
    ) => {
      if (!issues || issues.length === 0) return;

      setIsSimulating(true);

      const bBudget = defaultBudget;
      const bWorkers = defaultWorkers;
      const bVehicles = defaultVehicles;
      const bTime = defaultTime;

      const sBudget = overrideBudget !== undefined ? overrideBudget : scenarioBudget;
      const sWorkers = overrideWorkers !== undefined ? overrideWorkers : scenarioWorkers;
      const sVehicles = overrideVehicles !== undefined ? overrideVehicles : scenarioVehicles;
      const sTime = overrideTime !== undefined ? overrideTime : scenarioTime;

      try {
        const backendIssues = issues.map(transformCivicIssueToBackend);
        const baselineResources = {
          budget: bBudget,
          workers: bWorkers,
          vehicles: bVehicles,
          time_capacity_hours: bTime,
        };
        const scenarioResources = {
          budget: sBudget,
          workers: sWorkers,
          vehicles: sVehicles,
          time_capacity_hours: sTime,
        };

        const result = await cieService.evaluateScenario({
          issues: backendIssues,
          baseline_resources: baselineResources,
          scenario_resources: scenarioResources,
        });

        setScenarioResult(result);
      } catch (err) {
        console.error('Failed to run What-If scenario simulation:', err);
      } finally {
        setIsSimulating(false);
      }
    },
    [issues, defaultBudget, defaultWorkers, defaultVehicles, defaultTime, scenarioBudget, scenarioWorkers, scenarioVehicles, scenarioTime]
  );

  // Auto-run initial simulation once data is loaded
  useEffect(() => {
    if (issues.length > 0 && !scenarioResult && !isSimulating) {
      runSimulation();
    }
  }, [issues, scenarioResult, isSimulating, runSimulation]);

  // Preset Handlers
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    let b = defaultBudget;
    let w = defaultWorkers;
    let v = defaultVehicles;
    let t = defaultTime;

    if (preset === 'BUDGET_CUT') {
      b = Math.round(defaultBudget * 0.6); // -40%
      w = Math.max(2, Math.round(defaultWorkers * 0.7));
      v = Math.max(1, defaultVehicles - 1);
    } else if (preset === 'FLEET_CRISIS') {
      v = Math.max(1, defaultVehicles - 3); // -3 vehicles
    } else if (preset === 'WORKFORCE_CRUNCH') {
      w = Math.max(2, Math.round(defaultWorkers * 0.5)); // -50% workers
    } else if (preset === 'SURGE_FUNDING') {
      b = Math.round(defaultBudget * 1.5); // +50% budget
      w = defaultWorkers + 6;
      v = defaultVehicles + 3;
    } else {
      // BASELINE
      b = defaultBudget;
      w = defaultWorkers;
      v = defaultVehicles;
      t = defaultTime;
    }

    setScenarioBudget(b);
    setScenarioWorkers(w);
    setScenarioVehicles(v);
    setScenarioTime(t);

    runSimulation(b, w, v, t);
  };

  const handleReset = () => {
    applyPreset('BASELINE');
  };

  if (contextLoading && issues.length === 0) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" rows={4} />
      </div>
    );
  }

  // Lookups for issue details
  const issueMap = new Map<string, CivicIssue>(issues.map(i => [i.id, i]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              CIE What-If Resource Constraint Simulator
            </h1>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              OR-Tools Powered
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl">
            Simulate municipal resource modifications (budget shifts, fleet availability, workforce changes) and see how optimal civic resource allocations change while MCDA priority scores remain strictly invariant.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MCDA Invariance Rule Highlight */}
      <div className="bg-linear-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-black text-slate-900">
            Core Civic Invariance Rule: MCDA Urgency Is Constant
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Civic urgency scores (MCDA) measure intrinsic community need and <strong className="text-slate-900 font-bold">never change</strong> when resources vary. When municipal constraints tighten, OR-Tools reallocates capacity to maximize total public benefit across feasible issues.
          </p>
        </div>
      </div>

      {/* Interactive Controls & Preset Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Resource Sliders */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Hypothetical Scenario Parameters</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Live Constraint Sliders
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Municipal Stress-Test Presets:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('BASELINE')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                  activePreset === 'BASELINE'
                    ? 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] text-slate-900 font-black">Standard Baseline</div>
                <div className="text-[10px] text-slate-500 font-normal">₹3.4L / 18w / 5v</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('BUDGET_CUT')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                  activePreset === 'BUDGET_CUT'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] text-amber-900 font-black">-40% Budget Cut</div>
                <div className="text-[10px] text-slate-500 font-normal">₹2.0L / 12w / 4v</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('FLEET_CRISIS')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                  activePreset === 'FLEET_CRISIS'
                    ? 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] text-red-900 font-black">Fleet Breakdown</div>
                <div className="text-[10px] text-slate-500 font-normal">₹3.4L / 18w / 2v</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('SURGE_FUNDING')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                  activePreset === 'SURGE_FUNDING'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] text-emerald-900 font-black">+50% Surge Fund</div>
                <div className="text-[10px] text-slate-500 font-normal">₹5.1L / 24w / 8v</div>
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Budget Slider */}
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Available Budget</span>
                </span>
                <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-black">
                  ₹{scenarioBudget.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="800000"
                step="10000"
                value={scenarioBudget}
                onChange={e => {
                  setActivePreset('CUSTOM');
                  setScenarioBudget(Number(e.target.value));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>₹20,000</span>
                <span>Baseline: ₹{defaultBudget.toLocaleString('en-IN')}</span>
                <span>₹8,00,000</span>
              </div>
            </div>

            {/* Workers Slider */}
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  <span>Workforce Capacity</span>
                </span>
                <span className="font-mono text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md font-black">
                  {scenarioWorkers} Workers
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="1"
                value={scenarioWorkers}
                onChange={e => {
                  setActivePreset('CUSTOM');
                  setScenarioWorkers(Number(e.target.value));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 Worker</span>
                <span>Baseline: {defaultWorkers}w</span>
                <span>35 Workers</span>
              </div>
            </div>

            {/* Vehicles Slider */}
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fleet Availability</span>
                </span>
                <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-black">
                  {scenarioVehicles} Vehicles
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={scenarioVehicles}
                onChange={e => {
                  setActivePreset('CUSTOM');
                  setScenarioVehicles(Number(e.target.value));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 Vehicle</span>
                <span>Baseline: {defaultVehicles}v</span>
                <span>12 Vehicles</span>
              </div>
            </div>

            {/* Operational Time Slider */}
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Time Capacity (Shift)</span>
                </span>
                <span className="font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-black">
                  {scenarioTime} Hours
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="80"
                step="4"
                value={scenarioTime}
                onChange={e => {
                  setActivePreset('CUSTOM');
                  setScenarioTime(Number(e.target.value));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>8h Shift</span>
                <span>Baseline: {defaultTime}h</span>
                <span>80h Multi-Shift</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Delta Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Resource Constraint Delta</span>
            </h2>

            {scenarioResult ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600 font-medium">Budget Shift:</span>
                  <span
                    className={`font-mono font-bold ${
                      scenarioResult.resource_delta.budget_delta >= 0
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {scenarioResult.resource_delta.budget_delta >= 0 ? '+' : ''}₹
                    {scenarioResult.resource_delta.budget_delta.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600 font-medium">Workforce Shift:</span>
                  <span
                    className={`font-mono font-bold ${
                      scenarioResult.resource_delta.workers_delta >= 0
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {scenarioResult.resource_delta.workers_delta >= 0 ? '+' : ''}
                    {scenarioResult.resource_delta.workers_delta} Personnel
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600 font-medium">Fleet Shift:</span>
                  <span
                    className={`font-mono font-bold ${
                      scenarioResult.resource_delta.vehicles_delta >= 0
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {scenarioResult.resource_delta.vehicles_delta >= 0 ? '+' : ''}
                    {scenarioResult.resource_delta.vehicles_delta} Vehicles
                  </span>
                </div>

                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 text-[11px] space-y-1">
                  <div className="font-bold text-sky-950 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-sky-700" />
                    <span>Comparative Decision Status</span>
                  </div>
                  <p className="text-slate-600 leading-snug">
                    Scenario optimizer recomputed allocation based on knapsack density and constraint feasibility.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No simulation run yet. Click Run Simulation.
              </div>
            )}
          </div>

          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
            <span>Re-evaluate Optimization Plan</span>
          </button>
        </div>
      </div>

      {/* Simulation Results Section */}
      {scenarioResult && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Comparative Metrics KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Public Benefit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Total Public Benefit</span>
                {scenarioResult.impact_comparison.benefit_delta >= 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-black">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{scenarioResult.impact_comparison.benefit_delta.toFixed(1)}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-red-700 bg-red-100 text-[10px] px-2 py-0.5 rounded-full font-black">
                    <TrendingDown className="w-3 h-3" />
                    <span>{scenarioResult.impact_comparison.benefit_delta.toFixed(1)}</span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {scenarioResult.scenario_plan.total_benefit_score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  vs {scenarioResult.baseline_plan.total_benefit_score.toFixed(1)} (Base)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (scenarioResult.scenario_plan.total_benefit_score /
                        (scenarioResult.baseline_plan.total_benefit_score || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Selected Issues Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Issues Selected / Funded</span>
                {scenarioResult.impact_comparison.selected_count_delta >= 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-black">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{scenarioResult.impact_comparison.selected_count_delta}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-100 text-[10px] px-2 py-0.5 rounded-full font-black">
                    <TrendingDown className="w-3 h-3" />
                    <span>{scenarioResult.impact_comparison.selected_count_delta}</span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {scenarioResult.scenario_plan.selected_issue_ids.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  vs {scenarioResult.baseline_plan.selected_issue_ids.length} (Base)
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {scenarioResult.scenario_plan.deferred_issue_ids.length} deferred under scenario limits
              </div>
            </div>

            {/* Scenario Budget Utilization */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Scenario Budget Used</span>
                <span className="text-emerald-700 font-mono text-xs font-black">
                  ₹{scenarioResult.scenario_plan.resource_usage.allocated_budget.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹{scenarioResult.scenario_plan.resource_usage.remaining_budget.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">remaining</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (scenarioResult.scenario_plan.resource_usage.allocated_budget / (scenarioBudget || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Scenario Workforce Utilization */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Scenario Personnel Assigned</span>
                <span className="text-sky-700 font-mono text-xs font-black">
                  {scenarioResult.scenario_plan.resource_usage.allocated_workers} / {scenarioWorkers}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900 font-mono">
                  {scenarioResult.scenario_plan.resource_usage.remaining_workers}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">personnel available</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (scenarioResult.scenario_plan.resource_usage.allocated_workers / (scenarioWorkers || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Allocation Diff Grid: Newly Deferred / Newly Selected */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Newly Deferred Issues */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Newly Deferred Issues ({scenarioResult.allocation_diff.newly_deferred_issue_ids.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Funded in baseline, but dropped due to tighter scenario limits
                    </p>
                  </div>
                </div>
              </div>

              {scenarioResult.allocation_diff.newly_deferred_issue_ids.length > 0 ? (
                <div className="space-y-2.5">
                  {scenarioResult.allocation_diff.newly_deferred_issue_ids.map(id => {
                    const issue = issueMap.get(id);
                    const rank = scenarioResult.mcda_rankings.find(r => r.issue_id === id);

                    return (
                      <div
                        key={id}
                        className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{id}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                              DEFERRED
                            </span>
                            {rank && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                MCDA: {rank.composite_score.toFixed(1)} ({rank.priority_level})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium line-clamp-1">
                            {issue?.title || `Civic issue #${id}`}
                          </p>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
                          <div>₹{issue?.recommendation?.estimated_cost?.toLocaleString('en-IN') || '8,000'}</div>
                          <div>{issue?.recommendation?.required_workers || 2} workers</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  No baseline issues were deferred under this scenario.
                </div>
              )}
            </div>

            {/* Newly Selected Issues */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Newly Selected Issues ({scenarioResult.allocation_diff.newly_selected_issue_ids.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Gained funding due to expanded capacity in scenario
                    </p>
                  </div>
                </div>
              </div>

              {scenarioResult.allocation_diff.newly_selected_issue_ids.length > 0 ? (
                <div className="space-y-2.5">
                  {scenarioResult.allocation_diff.newly_selected_issue_ids.map(id => {
                    const issue = issueMap.get(id);
                    const rank = scenarioResult.mcda_rankings.find(r => r.issue_id === id);

                    return (
                      <div
                        key={id}
                        className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{id}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                              SELECTED
                            </span>
                            {rank && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                MCDA: {rank.composite_score.toFixed(1)} ({rank.priority_level})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium line-clamp-1">
                            {issue?.title || `Civic issue #${id}`}
                          </p>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
                          <div>₹{issue?.recommendation?.estimated_cost?.toLocaleString('en-IN') || '6,000'}</div>
                          <div>{issue?.recommendation?.required_workers || 2} workers</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  No additional issues selected (constraints remain equal or tighter).
                </div>
              )}
            </div>
          </div>

          {/* Deterministic Explanations Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>CIE Explainer Rationale for What-If Shift</span>
            </h3>
            <div className="space-y-2 text-xs">
              {scenarioResult.explanations.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{exp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
