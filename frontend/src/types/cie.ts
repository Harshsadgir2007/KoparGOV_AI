import { CivicPriorityLevel } from './index';

export interface CIEIssuePayload {
  id: string;
  title: string;
  category: string;
  description?: string;
  location?: string;
  severity: number;
  urgency: number;
  population_affected: number;
  health_safety_impact: number;
  location_sensitivity: number;
  complaint_age: number;
  estimated_cost?: number;
  required_workers?: number;
  required_vehicles?: number;
  required_time_hours?: number;
  latitude?: number;
  longitude?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CIEResourcesPayload {
  budget: number;
  workers: number;
  vehicles: number;
  time_capacity_hours?: number;
}

export interface CIEEvaluationRequest {
  issues: CIEIssuePayload[];
  resources: CIEResourcesPayload;
}

export interface MCDAFactorScores {
  normalized_severity: number;
  normalized_urgency: number;
  normalized_population_affected: number;
  normalized_health_safety_impact: number;
  normalized_location_sensitivity: number;
  normalized_complaint_age: number;
  factor_weights?: Record<string, number>;
  weighted_contributions?: Record<string, number>;
}

export interface MCDAScoreResult {
  issue_id: string;
  composite_score: number;
  priority_level: CivicPriorityLevel;
  factor_scores: MCDAFactorScores;
  rank?: number;
}

export interface ResourceUsage {
  allocated_budget: number;
  allocated_workers: number;
  allocated_vehicles: number;
  allocated_time_hours?: number;
  remaining_budget: number;
  remaining_workers: number;
  remaining_vehicles: number;
  remaining_time_hours?: number;
}

export interface OptimizationAllocationPlan {
  selected_issue_ids: string[];
  deferred_issue_ids: string[];
  total_benefit_score: number;
  resource_usage: ResourceUsage;
}

export interface FactorContribution {
  factor: string;
  normalized_score: number;
  weight: number;
  weighted_contribution: number;
}

export interface IssueExplanation {
  issue_id: string;
  priority_level: CivicPriorityLevel;
  composite_score: number;
  top_contributing_factors: FactorContribution[];
  resource_requirements: {
    estimated_cost?: number;
    required_workers?: number;
    required_vehicles?: number;
    required_time_hours?: number;
  };
  recommendation_status: 'RECOMMENDED' | 'DEFERRED' | string;
  reasons: string[];
  is_recommended_for_allocation: boolean;
  allocation_rationale: string;
  summary: string;
}

export interface IssueValidationReport {
  issue_id: string;
  is_valid: boolean;
  status: string;
  missing_fields?: string[];
  validation_errors?: string[];
}

export interface CIEPipelineResponse {
  validation_reports: IssueValidationReport[];
  valid_issue_count: number;
  flagged_issue_count: number;
  mcda_rankings: MCDAScoreResult[];
  allocation_plan?: OptimizationAllocationPlan;
  explanations: IssueExplanation[];
  status: string;
}
