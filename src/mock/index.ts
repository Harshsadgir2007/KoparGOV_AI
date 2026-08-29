export * from './issues';
export * from './recommendations';
export * from './assignments';
export * from './analytics';
export * from './citizens';

export const MOCK_RESOURCES = {
  available_budget: 42000,
  total_budget: 150000,
  available_workers: 18,
  total_workers: 45,
  available_vehicles: 6,
  total_vehicles: 12,
  equipment_status: [
    { name: 'Hydraulic Compactors', available: 2, total: 4 },
    { name: 'Suction Jetting Units', available: 1, total: 3 },
    { name: 'Road Patching Rollers', available: 1, total: 2 },
    { name: 'Emergency Water Tankers', available: 2, total: 5 },
  ],
};

export const MOCK_KPIS = {
  critical_issues: 8,
  high_priority: 17,
  pending_approvals: 6,
  active_assignments: 12,
  resolved: 42,
  budget_available: 42000,
  budget_utilization_pct: 72,
  workers_available: 18,
  workers_utilization_pct: 80,
  vehicles_available: 6,
  vehicles_utilization_pct: 67,
};

export { INITIAL_MOCK_ISSUES as MOCK_ISSUES } from './issues';
