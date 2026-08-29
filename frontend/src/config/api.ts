/**
 * Global API configuration for KoparGov AI.
 * Uses VITE_API_BASE_URL if specified in the environment, defaulting to http://127.0.0.1:8000
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  ROOT: `${API_BASE_URL}/`,
  ISSUES: `${API_BASE_URL}/api/issues`,
  ISSUE_DETAIL: (id: string) => `${API_BASE_URL}/api/issues/${id}`,
  CIE_EVALUATE: `${API_BASE_URL}/api/cie/evaluate`,
  CIE_SCENARIO: `${API_BASE_URL}/api/cie/scenario`,
  WORKFLOW_STATE: (id: string) => `${API_BASE_URL}/api/workflow/${id}`,
  WORKFLOW_APPROVE: (id: string) => `${API_BASE_URL}/api/workflow/${id}/approve`,
  WORKFLOW_REJECT: (id: string) => `${API_BASE_URL}/api/workflow/${id}/reject`,
  WORKFLOW_ASSIGN: (id: string) => `${API_BASE_URL}/api/workflow/${id}/assign`,
  WORKFLOW_START: (id: string) => `${API_BASE_URL}/api/workflow/${id}/start`,
  WORKFLOW_RESOLVE: (id: string) => `${API_BASE_URL}/api/workflow/${id}/resolve`,
  RESILIENCE_STATUS: `${API_BASE_URL}/api/resilience/status`,
  RESILIENCE_SIMULATE_BLACKOUT: `${API_BASE_URL}/api/resilience/simulate-blackout`,
  RESILIENCE_RECOVER: `${API_BASE_URL}/api/resilience/recover`,
  RESILIENCE_RECOVERY_REPORT: `${API_BASE_URL}/api/resilience/recovery-report`,
  RESILIENCE_RECONCILE: (opId: string) => `${API_BASE_URL}/api/resilience/reconcile/${opId}`,
  RESILIENCE_SNAPSHOT: `${API_BASE_URL}/api/resilience/snapshot`,
  RESILIENCE_JOURNAL: `${API_BASE_URL}/api/resilience/journal`,
  RESILIENCE_SNAPSHOTS: `${API_BASE_URL}/api/resilience/snapshots`,
  RESILIENCE_RESET: `${API_BASE_URL}/api/resilience/reset`,
};

