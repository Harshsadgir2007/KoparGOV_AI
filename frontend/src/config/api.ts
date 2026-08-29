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
  CIE_EVALUATE: `${API_BASE_URL}/api/cie/evaluate`,
  CIE_SCENARIO: `${API_BASE_URL}/api/cie/scenario`,
  WORKFLOW_STATE: (id: string) => `${API_BASE_URL}/api/workflow/${id}`,
  WORKFLOW_APPROVE: (id: string) => `${API_BASE_URL}/api/workflow/${id}/approve`,
  WORKFLOW_REJECT: (id: string) => `${API_BASE_URL}/api/workflow/${id}/reject`,
  WORKFLOW_ASSIGN: (id: string) => `${API_BASE_URL}/api/workflow/${id}/assign`,
  WORKFLOW_START: (id: string) => `${API_BASE_URL}/api/workflow/${id}/start`,
  WORKFLOW_RESOLVE: (id: string) => `${API_BASE_URL}/api/workflow/${id}/resolve`,
};
