import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  CivicIssue,
  MunicipalResources,
  CIERecommendationDetail,
  CIEEvaluationRequest,
  CIEPipelineResponse,
  CIEIssuePayload,
  CIEResourcesPayload,
  MCDAScoreResult,
  IssueExplanation,
  OptimizationAllocationPlan,
} from '../types';

// In-memory evaluation cache to avoid duplicate API requests during renders
interface CachedEvaluation {
  timestamp: number;
  response: CIEPipelineResponse;
}
const evaluationCache = new Map<string, CachedEvaluation>();
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Transforms a frontend CivicIssue into the schema expected by the FastAPI CIE backend.
 */
export function transformCivicIssueToBackend(issue: CivicIssue): CIEIssuePayload {
  const factors = issue.factors || {
    severity: 85,
    urgency: 80,
    population_affected: issue.population_affected || 500,
    health_safety: 75,
    location_sensitivity: 70,
    complaint_age_days: issue.age_days || 1,
  };

  return {
    id: issue.id,
    title: issue.title || `Civic issue in ${issue.ward}`,
    category: issue.category || 'General',
    description: issue.description || issue.title,
    location: issue.address || issue.ward || 'Kopargaon',
    severity: factors.severity ?? 80,
    urgency: factors.urgency ?? 75,
    population_affected: issue.population_affected || factors.population_affected || 500,
    health_safety_impact: factors.health_safety ?? 70,
    location_sensitivity: factors.location_sensitivity ?? 70,
    complaint_age: issue.age_days ?? factors.complaint_age_days ?? 1,
    estimated_cost: issue.recommendation?.estimated_cost ?? 15000,
    required_workers: issue.recommendation?.required_workers ?? 2,
    required_vehicles: issue.recommendation?.required_vehicles ?? 1,
    required_time_hours: 4,
    latitude: issue.coordinates?.[0] ?? 19.8917,
    longitude: issue.coordinates?.[1] ?? 74.4789,
    status: issue.status || 'SUBMITTED',
    created_at: issue.submitted_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transforms frontend MunicipalResources into the schema expected by the FastAPI CIE backend.
 */
export function transformResourcesToBackend(resources?: MunicipalResources | null): CIEResourcesPayload {
  if (!resources) {
    return {
      budget: 340000,
      workers: 18,
      vehicles: 5,
      time_capacity_hours: 40,
    };
  }

  return {
    budget: resources.available_budget ?? resources.total_budget ?? 340000,
    workers: resources.available_workers ?? resources.total_workers ?? 18,
    vehicles: resources.available_vehicles ?? resources.total_vehicles ?? 5,
    time_capacity_hours: 40,
  };
}

/**
 * Constructs a fallback CIEPipelineResponse using deterministic calculations
 * when the FastAPI backend service is offline or unreachable.
 */
function createLocalFallbackPipelineResponse(
  issues: CIEIssuePayload[],
  resources: CIEResourcesPayload
): CIEPipelineResponse {
  // Deterministic MCDA weights according to CIE specification:
  // Severity (25%), Urgency (20%), Population (20%), Health Risk (15%), Location Sensitivity (10%), Complaint Age (10%)
  const mcdaRankings: MCDAScoreResult[] = issues.map(issue => {
    const normSeverity = Math.min(100, Math.max(0, issue.severity));
    const normUrgency = Math.min(100, Math.max(0, issue.urgency));
    const normPop = Math.min(100, Math.max(0, (issue.population_affected / 1200) * 100));
    const normHealth = Math.min(100, Math.max(0, issue.health_safety_impact));
    const normLocation = Math.min(100, Math.max(0, issue.location_sensitivity));
    const normAge = Math.min(100, Math.max(0, (issue.complaint_age / 10) * 100));

    const weightedSeverity = normSeverity * 0.25;
    const weightedUrgency = normUrgency * 0.20;
    const weightedPop = normPop * 0.20;
    const weightedHealth = normHealth * 0.15;
    const weightedLocation = normLocation * 0.10;
    const weightedAge = normAge * 0.10;

    const compositeScore = Number(
      (weightedSeverity + weightedUrgency + weightedPop + weightedHealth + weightedLocation + weightedAge).toFixed(2)
    );

    let priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (compositeScore >= 80) priorityLevel = 'CRITICAL';
    else if (compositeScore >= 60) priorityLevel = 'HIGH';
    else if (compositeScore >= 40) priorityLevel = 'MEDIUM';

    return {
      issue_id: issue.id,
      composite_score: compositeScore,
      priority_level: priorityLevel,
      factor_scores: {
        normalized_severity: normSeverity,
        normalized_urgency: normUrgency,
        normalized_population_affected: normPop,
        normalized_health_safety_impact: normHealth,
        normalized_location_sensitivity: normLocation,
        normalized_complaint_age: normAge,
        factor_weights: {
          severity: 0.25,
          urgency: 0.20,
          population_affected: 0.20,
          health_safety_impact: 0.15,
          location_sensitivity: 0.10,
          complaint_age: 0.10,
        },
        weighted_contributions: {
          severity: Number(weightedSeverity.toFixed(2)),
          urgency: Number(weightedUrgency.toFixed(2)),
          population_affected: Number(weightedPop.toFixed(2)),
          health_safety_impact: Number(weightedHealth.toFixed(2)),
          location_sensitivity: Number(weightedLocation.toFixed(2)),
          complaint_age: Number(weightedAge.toFixed(2)),
        },
      },
    };
  });

  // Sort and assign ranks
  mcdaRankings.sort((a, b) => b.composite_score - a.composite_score);
  mcdaRankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  // Simple greedy knapsack allocation simulation
  let remBudget = resources.budget;
  let remWorkers = resources.workers;
  let remVehicles = resources.vehicles;
  let remTime = resources.time_capacity_hours || 40;

  const selectedIds: string[] = [];
  const deferredIds: string[] = [];
  let totalBenefit = 0;

  for (const ranking of mcdaRankings) {
    const rawIssue = issues.find(i => i.id === ranking.issue_id);
    const cost = rawIssue?.estimated_cost ?? 10000;
    const workers = rawIssue?.required_workers ?? 2;
    const vehicles = rawIssue?.required_vehicles ?? 1;
    const time = rawIssue?.required_time_hours ?? 4;

    if (remBudget >= cost && remWorkers >= workers && remVehicles >= vehicles && remTime >= time) {
      selectedIds.push(ranking.issue_id);
      totalBenefit += ranking.composite_score;
      remBudget -= cost;
      remWorkers -= workers;
      remVehicles -= vehicles;
      remTime -= time;
    } else {
      deferredIds.push(ranking.issue_id);
    }
  }

  const explanations: IssueExplanation[] = mcdaRankings.map(ranking => {
    const isSelected = selectedIds.includes(ranking.issue_id);
    const rawIssue = issues.find(i => i.id === ranking.issue_id);
    const cost = rawIssue?.estimated_cost ?? 10000;
    const workers = rawIssue?.required_workers ?? 2;
    const vehicles = rawIssue?.required_vehicles ?? 1;
    const time = rawIssue?.required_time_hours ?? 4;

    const drivers = [
      { factor: 'severity', score: ranking.factor_scores.normalized_severity, pts: ranking.factor_scores.weighted_contributions?.severity || 0 },
      { factor: 'urgency', score: ranking.factor_scores.normalized_urgency, pts: ranking.factor_scores.weighted_contributions?.urgency || 0 },
      { factor: 'population_affected', score: ranking.factor_scores.normalized_population_affected, pts: ranking.factor_scores.weighted_contributions?.population_affected || 0 },
      { factor: 'health_safety', score: ranking.factor_scores.normalized_health_safety_impact, pts: ranking.factor_scores.weighted_contributions?.health_safety_impact || 0 },
    ].sort((a, b) => b.pts - a.pts);

    return {
      issue_id: ranking.issue_id,
      priority_level: ranking.priority_level,
      composite_score: ranking.composite_score,
      top_contributing_factors: drivers.map(d => ({
        factor: d.factor,
        normalized_score: d.score,
        weight: d.factor === 'severity' ? 0.25 : 0.20,
        weighted_contribution: d.pts,
      })),
      resource_requirements: {
        estimated_cost: cost,
        required_workers: workers,
        required_vehicles: vehicles,
        required_time_hours: time,
      },
      recommendation_status: isSelected ? 'RECOMMENDED' : 'DEFERRED',
      reasons: [
        `Severity and urgency contributed ${(ranking.factor_scores.weighted_contributions?.severity || 0) + (ranking.factor_scores.weighted_contributions?.urgency || 0)} points to priority score.`,
        `Directly impacts citizen zone with ${rawIssue?.population_affected || 500} population density.`,
        isSelected
          ? `Selected by resource optimizer: fits within available municipal budget (₹${resources.budget.toLocaleString('en-IN')}) and workforce.`
          : 'Deferred by resource optimizer: exceeds available budget or personnel capacity.',
      ],
      is_recommended_for_allocation: isSelected,
      allocation_rationale: isSelected
        ? 'Selected for immediate action by resource-constrained optimization.'
        : 'Deferred under current resource envelope; scheduled for next shift/budget tranche.',
      summary: `Issue ${ranking.issue_id} evaluated as ${ranking.priority_level} priority (score: ${ranking.composite_score}). Status: ${isSelected ? 'RECOMMENDED' : 'DEFERRED'}.`,
    };
  });

  return {
    validation_reports: issues.map(i => ({
      issue_id: i.id,
      is_valid: true,
      status: 'VALID',
      missing_fields: [],
      validation_errors: [],
    })),
    valid_issue_count: issues.length,
    flagged_issue_count: 0,
    mcda_rankings: mcdaRankings,
    allocation_plan: {
      selected_issue_ids: selectedIds,
      deferred_issue_ids: deferredIds,
      total_benefit_score: Number(totalBenefit.toFixed(2)),
      resource_usage: {
        allocated_budget: resources.budget - remBudget,
        allocated_workers: resources.workers - remWorkers,
        allocated_vehicles: resources.vehicles - remVehicles,
        allocated_time_hours: (resources.time_capacity_hours || 40) - remTime,
        remaining_budget: remBudget,
        remaining_workers: remWorkers,
        remaining_vehicles: remVehicles,
        remaining_time_hours: remTime,
      },
    },
    explanations,
    status: 'SUCCESS',
  };
}

export const cieService = {
  /**
   * Main method to evaluate a batch of civic issues against municipal resources via FastAPI backend.
   * Seamlessly falls back to high-fidelity local calculation if backend is unreachable.
   */
  async evaluateCIE(request: CIEEvaluationRequest): Promise<{
    data: CIEPipelineResponse;
    source: 'LIVE_FASTAPI' | 'LOCAL_MOCK_FALLBACK';
  }> {
    const cacheKey = JSON.stringify({
      issue_ids: request.issues.map(i => i.id).sort(),
      budget: request.resources.budget,
      workers: request.resources.workers,
      vehicles: request.resources.vehicles,
    });

    const cached = evaluationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { data: cached.response, source: 'LIVE_FASTAPI' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(API_ENDPOINTS.CIE_EVALUATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: CIEPipelineResponse = await response.json();
        evaluationCache.set(cacheKey, { timestamp: Date.now(), response: data });
        return { data, source: 'LIVE_FASTAPI' };
      } else {
        console.warn(`CIE Backend returned status ${response.status}. Using fallback mock engine.`);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn(`CIE Backend endpoint (${API_ENDPOINTS.CIE_EVALUATE}) unreachable: ${err.message}. Using fallback mock engine.`);
      }
    }

    // Fallback calculation if backend is not responding
    const fallbackData = createLocalFallbackPipelineResponse(request.issues, request.resources);
    return { data: fallbackData, source: 'LOCAL_MOCK_FALLBACK' };
  },

  /**
   * Convenience method to evaluate a single issue against current municipal resources
   * and produce a full CIERecommendationDetail model for officer decision screens.
   */
  async evaluateSingleIssue(
    issue: CivicIssue,
    allIssues: CivicIssue[] = [],
    resources?: MunicipalResources | null
  ): Promise<CIERecommendationDetail> {
    const targetPayload = transformCivicIssueToBackend(issue);
    
    // Include context issues so OR-Tools and MCDA can rank correctly
    const otherPayloads = allIssues
      .filter(i => i.id !== issue.id)
      .slice(0, 7)
      .map(transformCivicIssueToBackend);

    const issuesBatch = [targetPayload, ...otherPayloads];
    const resourcesPayload = transformResourcesToBackend(resources);

    const { data: pipelineResult, source } = await this.evaluateCIE({
      issues: issuesBatch,
      resources: resourcesPayload,
    });

    const mcdaResult = pipelineResult.mcda_rankings.find(r => r.issue_id === issue.id) || {
      issue_id: issue.id,
      composite_score: issue.priority_score || 85,
      priority_level: issue.priority_level || 'CRITICAL',
      factor_scores: {
        normalized_severity: issue.factors?.severity || 85,
        normalized_urgency: issue.factors?.urgency || 80,
        normalized_population_affected: 80,
        normalized_health_safety_impact: issue.factors?.health_safety || 75,
        normalized_location_sensitivity: issue.factors?.location_sensitivity || 70,
        normalized_complaint_age: 50,
      },
      rank: 1,
    };

    const explanation = pipelineResult.explanations.find(e => e.issue_id === issue.id);
    const plan = pipelineResult.allocation_plan;
    const isSelected = plan?.selected_issue_ids.includes(issue.id) ?? true;

    const estimatedCost = explanation?.resource_requirements?.estimated_cost ?? issue.recommendation?.estimated_cost ?? 8000;
    const requiredWorkers = explanation?.resource_requirements?.required_workers ?? issue.recommendation?.required_workers ?? 2;
    const requiredVehicles = explanation?.resource_requirements?.required_vehicles ?? issue.recommendation?.required_vehicles ?? 1;

    const totalBudget = resourcesPayload.budget;
    const totalWorkers = resourcesPayload.workers;
    const totalVehicles = resourcesPayload.vehicles;

    const remainingBudget = plan?.resource_usage?.remaining_budget ?? Math.max(0, totalBudget - estimatedCost);
    const remainingWorkers = plan?.resource_usage?.remaining_workers ?? Math.max(0, totalWorkers - requiredWorkers);
    const remainingVehicles = plan?.resource_usage?.remaining_vehicles ?? Math.max(0, totalVehicles - requiredVehicles);

    const reasons = explanation?.reasons?.length
      ? explanation.reasons
      : (issue.recommendation?.rationales || [
          `Top factor: Severity contributed to ${mcdaResult.composite_score} priority score.`,
          `High population impact across ${issue.ward}.`,
          isSelected
            ? 'Selected by OR-Tools resource optimizer within municipal capacity.'
            : 'Deferred due to municipal capacity constraints.',
        ]);

    return {
      issue_id: issue.id,
      issue_title: issue.title,
      ward: issue.ward,
      category: issue.category,
      status: issue.status,
      priority_score: mcdaResult.composite_score,
      priority_level: mcdaResult.priority_level,
      rank: mcdaResult.rank,
      factors: {
        severity: mcdaResult.factor_scores?.normalized_severity ?? (issue.factors?.severity || 85),
        urgency: mcdaResult.factor_scores?.normalized_urgency ?? (issue.factors?.urgency || 80),
        population_affected: issue.population_affected || 1200,
        health_safety: mcdaResult.factor_scores?.normalized_health_safety_impact ?? (issue.factors?.health_safety || 75),
        location_sensitivity: mcdaResult.factor_scores?.normalized_location_sensitivity ?? (issue.factors?.location_sensitivity || 70),
        complaint_age_days: issue.age_days || 1,
      },
      recommended_action: {
        headline: isSelected
          ? (issue.recommendation?.recommended_action || `Deploy ${issue.category} Rapid Response Team (${requiredWorkers} Workers, ${requiredVehicles} Vehicle)`)
          : `Deferred: ${issue.category} response scheduled for next operational window`,
        vehicle: issue.recommendation?.vehicle_type || `Vehicle ${requiredVehicles} (Municipal Response Unit)`,
        workers: requiredWorkers,
        estimated_cost: estimatedCost,
        estimated_time: `${explanation?.resource_requirements?.required_time_hours || 2} hours`,
      },
      reasons,
      resource_availability: {
        budget_available: totalBudget,
        budget_required: estimatedCost,
        budget_remaining: remainingBudget,
        workers_available: totalWorkers,
        workers_required: requiredWorkers,
        workers_remaining: remainingWorkers,
        vehicles_available: totalVehicles,
        vehicles_required: requiredVehicles,
        vehicles_remaining: remainingVehicles,
      },
      alternatives: [
        {
          id: 'OPT-A',
          name: isSelected ? 'Option A — Recommended Optimal Allocation' : 'Option A — Standard Allocation (Deferred)',
          action: `Deploy Unit with ${requiredWorkers} Workers & ${requiredVehicles} Vehicle`,
          cost: estimatedCost,
          benefit: mcdaResult.priority_level === 'CRITICAL' ? 'High' : 'Medium',
          resource_impact: estimatedCost > 15000 ? 'High' : 'Low',
          is_recommended: isSelected,
          notes: isSelected
            ? 'Optimal recommendation maximizing municipal benefit within resource limits'
            : 'Deferred due to constraint capacity limits',
        },
        {
          id: 'OPT-B',
          name: 'Option B — Minimal Rapid Intervention',
          action: `Deploy 1 Worker for temporary mitigation containment`,
          cost: Math.round(estimatedCost * 0.4),
          benefit: 'Medium',
          resource_impact: 'Low',
          is_recommended: !isSelected,
          notes: 'Immediate lower-cost interim measure',
        },
      ],
      recommendation_status: isSelected ? 'RECOMMENDED' : 'DEFERRED',
      is_recommended_for_allocation: isSelected,
      allocation_rationale: explanation?.allocation_rationale || (
        isSelected
          ? 'Selected for immediate action by resource-constrained optimization.'
          : 'Deferred under current capacity envelope.'
      ),
      summary: explanation?.summary || `Issue ${issue.id} evaluated as ${mcdaResult.priority_level} priority (score: ${mcdaResult.composite_score}).`,
      backend_source: source,
    };
  },
};
