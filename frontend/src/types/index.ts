export type CivicPriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CivicStatus =
  | 'REPORTED'
  | 'VALIDATED'
  | 'PRIORITIZED'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export type CivicCategory =
  | 'Garbage Accumulation'
  | 'Water Supply & Pipeline'
  | 'Potholes & Road Damage'
  | 'Drainage & Sewage'
  | 'Streetlight Outage'
  | 'Public Health & Sanitation';

export interface CIEFactors {
  severity: number; // 0-100
  urgency: number; // 0-100
  population_affected: number;
  health_safety: number; // 0-100
  location_sensitivity: number; // 0-100
  complaint_age_days: number;
}

export interface CIEResourceImpact {
  budget_required: number;
  budget_available: number;
  workers_required: number;
  workers_available: number;
  vehicles_required: number;
  vehicles_available: number;
}

export interface CIEAlternativeOption {
  id: string;
  name: string; // e.g. "Option A — Recommended"
  action: string; // e.g. "Vehicle 2 + 2 Workers"
  cost: number;
  benefit: 'High' | 'Medium' | 'Low';
  resource_impact: 'Low' | 'Medium' | 'High';
  is_recommended: boolean;
  notes?: string;
}

export interface CIERecommendationDetail {
  issue_id: string;
  issue_title: string;
  ward: string;
  category: CivicCategory;
  status: CivicStatus;
  priority_score: number;
  priority_level: CivicPriorityLevel;
  factors: CIEFactors;
  recommended_action: {
    headline: string; // e.g. "Deploy Vehicle 2 + 2 Workers"
    vehicle: string; // e.g. "Vehicle 2 (Hydraulic Compactor)"
    workers: number; // 2
    estimated_cost: number; // 8000
    estimated_time: string; // "2 hours"
  };
  reasons: string[];
  resource_availability: {
    budget_available: number;
    budget_required: number;
    budget_remaining: number;
    workers_available: number;
    workers_required: number;
    workers_remaining: number;
    vehicles_available: number;
    vehicles_required: number;
    vehicles_remaining: number;
  };
  alternatives: CIEAlternativeOption[];
  approved_by?: string;
  approved_at?: string;
  rank?: number;
  recommendation_status?: 'RECOMMENDED' | 'DEFERRED' | string;
  is_recommended_for_allocation?: boolean;
  allocation_rationale?: string;
  summary?: string;
  backend_source?: 'LIVE_FASTAPI' | 'LOCAL_MOCK_FALLBACK';
}

export * from './cie';

export interface CIERecommendation {
  recommended_action: string;
  assigned_team_type: string;
  required_workers: number;
  required_vehicles: number;
  vehicle_type: string;
  estimated_cost: number;
  rationales: string[];
  resource_impact: CIEResourceImpact;
  approved_by?: string;
  approved_at?: string;
}

export interface AssignmentDetails {
  team_name: string;
  vehicle_id: string;
  lead_worker: string;
  worker_count: number;
  assigned_at: string;
  notes?: string;
}

export interface ResolutionDetails {
  resolved_at: string;
  completion_notes: string;
  after_photos: string[];
  verified_by: string;
  actual_cost?: number;
}

export interface MunicipalAssignment {
  assignment_id: string;
  issue_id: string;
  issue_title: string;
  ward: string;
  category: CivicCategory;
  priority: number;
  priority_level: CivicPriorityLevel;
  team: string;
  vehicle: string;
  workers: number;
  estimated_cost: number;
  estimated_time: string;
  status: CivicStatus;
  assigned_at?: string;
  notes?: string;
  before_photo?: string;
  resolution?: ResolutionDetails;
}

export type CitizenIdentityMode = 'PUBLIC' | 'ANONYMOUS';

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  identity_type: CitizenIdentityMode;
  reports: number;
  resolved: number;
  score: number;
  is_current_user?: boolean;
}

export interface CitizenProfile {
  id: string;
  real_name: string;
  identity_mode: CitizenIdentityMode;
  leaderboard_enabled: boolean;
  alias?: string;
  phone: string;
  address: string;
  ward: string;
  reports_count: number;
  resolved_count: number;
  contribution_score: number;
}

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: CivicCategory;
  ward: string;
  ward_number: number;
  coordinates: [number, number]; // [lat, lng]
  address: string;
  submitted_at: string;
  age_days: number;
  status: CivicStatus;
  priority_score: number; // 0-100
  priority_level: CivicPriorityLevel;
  population_affected: number;
  citizen_name?: string;
  citizen_phone?: string;
  identity_mode?: CitizenIdentityMode;
  is_anonymous?: boolean;
  reporter_display_name?: string;
  before_photos: string[];
  after_photos?: string[];
  factors: CIEFactors;
  recommendation?: CIERecommendation;
  assignment?: AssignmentDetails;
  resolution?: ResolutionDetails;
}

export interface MunicipalResources {
  available_budget: number;
  total_budget: number;
  available_workers: number;
  total_workers: number;
  available_vehicles: number;
  total_vehicles: number;
  equipment_status: {
    name: string;
    available: number;
    total: number;
  }[];
}

export interface AnalyticsOverview {
  total_issues: number;
  critical_issues: number;
  high_priority_issues: number;
  pending_approvals: number;
  active_assignments: number;
  resolved_issues: number;
  critical_resolved: number;
  avg_response_time_hours: number;
  population_benefited: number;
  budget_utilized: number;
  budget_total: number;
  worker_utilization_pct: number;
  vehicle_utilization_pct: number;
  category_distribution: { category: string; count: number; critical: number }[];
  ward_distribution: { ward: string; issues: number; resolved: number }[];
  priority_distribution: { level: CivicPriorityLevel; count: number; color: string }[];
  resolution_trends: { date: string; reported: number; resolved: number }[];
}

export type UserRole = 'OFFICER' | 'CITIZEN';

export interface UserSession {
  role: UserRole;
  name: string;
  designation?: string;
  department?: string;
  phone?: string;
}
