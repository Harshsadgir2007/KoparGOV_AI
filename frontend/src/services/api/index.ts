import { CivicIssue, MunicipalResources, AnalyticsOverview, AssignmentDetails, ResolutionDetails } from '../../types';
import { INITIAL_ISSUES, INITIAL_RESOURCES, INITIAL_ANALYTICS } from '../../data/mockData';

const ISSUES_STORAGE_KEY = 'kopargov_issues_v1';
const RESOURCES_STORAGE_KEY = 'kopargov_resources_v1';
const ANALYTICS_STORAGE_KEY = 'kopargov_analytics_v1';

// Initialize local state if not exists
function getStoredIssues(): CivicIssue[] {
  try {
    const data = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading localStorage issues:', e);
  }
  localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
  return INITIAL_ISSUES;
}

function saveStoredIssues(issues: CivicIssue[]) {
  try {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
  } catch (e) {
    console.error('Error saving issues to localStorage:', e);
  }
}

function getStoredResources(): MunicipalResources {
  try {
    const data = localStorage.getItem(RESOURCES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading localStorage resources:', e);
  }
  localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(INITIAL_RESOURCES));
  return INITIAL_RESOURCES;
}

function saveStoredResources(res: MunicipalResources) {
  try {
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(res));
  } catch (e) {
    console.error('Error saving resources to localStorage:', e);
  }
}

import { API_BASE_URL } from '../../config/api';
import { cieService } from '../cieService';

export { cieService };

export const api = {
  async getIssues(filters?: {
    category?: string;
    ward?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<CivicIssue[]> {
    if (API_BASE_URL) {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.category && filters.category !== 'ALL') queryParams.set('category', filters.category);
        if (filters?.ward && filters.ward !== 'ALL') queryParams.set('ward', filters.ward);
        if (filters?.priority && filters.priority !== 'ALL') queryParams.set('priority', filters.priority);
        if (filters?.status && filters.status !== 'ALL') queryParams.set('status', filters.status);
        if (filters?.search) queryParams.set('search', filters.search);

        const res = await fetch(`${API_BASE_URL}/issues?${queryParams.toString()}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend API unavailable, using local CIE mock data store:', err);
      }
    }

    // Fallback Mock Local Storage Engine
    let issues = getStoredIssues();

    if (filters) {
      if (filters.category && filters.category !== 'ALL') {
        issues = issues.filter(i => i.category === filters.category);
      }
      if (filters.ward && filters.ward !== 'ALL') {
        issues = issues.filter(i => i.ward === filters.ward || `Ward ${i.ward_number}` === filters.ward);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        issues = issues.filter(i => i.priority_level === filters.priority);
      }
      if (filters.status && filters.status !== 'ALL') {
        issues = issues.filter(i => i.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        issues = issues.filter(
          i =>
            i.id.toLowerCase().includes(q) ||
            i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.address.toLowerCase().includes(q) ||
            i.ward.toLowerCase().includes(q)
        );
      }
    }

    // Sort by priority score descending by default
    return issues.sort((a, b) => b.priority_score - a.priority_score);
  },

  async getIssueById(id: string): Promise<CivicIssue | undefined> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/issues/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend API unavailable, using mock data for issue:', id, err);
      }
    }
    const issues = getStoredIssues();
    return issues.find(i => i.id.toLowerCase() === id.toLowerCase());
  },

  async createIssue(newIssueData: Partial<CivicIssue>): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const nextIdNumber = 1030 + issues.length;
    const issueId = `ISS-${nextIdNumber}`;

    // CIE Priority Engine Simulation (Purely illustrative for demo until FastAPI backend delivers)
    const severity = newIssueData.factors?.severity || 75;
    const urgency = newIssueData.factors?.urgency || 70;
    const pop = newIssueData.population_affected || 500;
    const calculatedScore = Math.min(
      98,
      Math.round((severity * 0.35) + (urgency * 0.3) + (Math.min(pop, 2000) / 2000 * 25) + 10)
    );

    let priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (calculatedScore >= 85) priority_level = 'CRITICAL';
    else if (calculatedScore >= 70) priority_level = 'HIGH';
    else if (calculatedScore >= 50) priority_level = 'MEDIUM';
    else priority_level = 'LOW';

    const fullIssue: CivicIssue = {
      id: issueId,
      title: newIssueData.title || 'Reported Civic Issue',
      description: newIssueData.description || 'No detailed description provided.',
      category: newIssueData.category || 'Garbage Accumulation',
      ward: newIssueData.ward || 'Ward 1 - Gandhi Chowk & Tilak Road',
      ward_number: newIssueData.ward_number || 1,
      coordinates: newIssueData.coordinates || [19.8917, 74.4789],
      address: newIssueData.address || 'Kopargaon, Maharashtra 423601',
      submitted_at: new Date().toISOString(),
      age_days: 0,
      status: 'REPORTED',
      priority_score: calculatedScore,
      priority_level: priority_level,
      population_affected: pop,
      citizen_name: newIssueData.citizen_name || 'Anonymous Citizen',
      citizen_phone: newIssueData.citizen_phone || '',
      before_photos: newIssueData.before_photos?.length
        ? newIssueData.before_photos
        : ['https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'],
      factors: newIssueData.factors || {
        severity: severity,
        urgency: urgency,
        population_affected: 80,
        health_safety: 75,
        location_sensitivity: 70,
        complaint_age_days: 10,
      },
      recommendation: {
        recommended_action: `Dispatch rapid response unit for ${newIssueData.category || 'reported issue'} mitigation.`,
        assigned_team_type: 'Municipal Rapid Action Squad',
        required_workers: 2,
        required_vehicles: 1,
        vehicle_type: 'Municipal Utility Carrier',
        estimated_cost: 5000,
        rationales: [
          'Calculated priority score exceeds action threshold',
          `Directly impacts estimated ${pop} local citizens in immediate vicinity`,
          'Aligns with current available municipal operational team shift'
        ],
        resource_impact: {
          budget_required: 5000,
          budget_available: 25000,
          workers_required: 2,
          workers_available: 6,
          vehicles_required: 1,
          vehicles_available: 2,
        }
      }
    };

    issues.unshift(fullIssue);
    saveStoredIssues(issues);
    return fullIssue;
  },

  async approveRecommendation(id: string, officerName: string = 'Municipal Commissioner'): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Issue not found');

    const updated = { ...issues[index] };
    updated.status = 'APPROVED';
    if (updated.recommendation) {
      updated.recommendation.approved_by = officerName;
      updated.recommendation.approved_at = new Date().toISOString();
    }

    issues[index] = updated;
    saveStoredIssues(issues);
    return updated;
  },

  async assignTeam(id: string, assignment: AssignmentDetails): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Issue not found');

    const updated = { ...issues[index] };
    updated.status = 'ASSIGNED';
    updated.assignment = {
      ...assignment,
      assigned_at: new Date().toISOString()
    };

    // Deduct available resources
    const resources = getStoredResources();
    if (resources.available_workers >= assignment.worker_count) {
      resources.available_workers -= assignment.worker_count;
    }
    if (resources.available_vehicles > 0) {
      resources.available_vehicles -= 1;
    }
    saveStoredResources(resources);

    issues[index] = updated;
    saveStoredIssues(issues);
    return updated;
  },

  async updateStatus(id: string, status: CivicIssue['status']): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Issue not found');

    issues[index].status = status;
    saveStoredIssues(issues);
    return issues[index];
  },

  async resolveIssue(id: string, resolution: ResolutionDetails): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Issue not found');

    const updated = { ...issues[index] };
    updated.status = 'RESOLVED';
    updated.resolution = {
      ...resolution,
      resolved_at: new Date().toISOString()
    };

    // Free back resources
    const resources = getStoredResources();
    if (updated.assignment) {
      resources.available_workers = Math.min(resources.total_workers, resources.available_workers + updated.assignment.worker_count);
      resources.available_vehicles = Math.min(resources.total_vehicles, resources.available_vehicles + 1);
    }
    if (resolution.actual_cost) {
      resources.available_budget = Math.max(0, resources.available_budget - resolution.actual_cost);
    }
    saveStoredResources(resources);

    issues[index] = updated;
    saveStoredIssues(issues);
    return updated;
  },

  async getResources(): Promise<MunicipalResources> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/resources`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend resources unavailable, using local mock store:', err);
      }
    }
    return getStoredResources();
  },

  async getAnalytics(): Promise<AnalyticsOverview> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend analytics unavailable, calculating from store:', err);
      }
    }
    const issues = getStoredIssues();
    const resources = getStoredResources();

    const criticalCount = issues.filter(i => i.priority_level === 'CRITICAL').length;
    const highCount = issues.filter(i => i.priority_level === 'HIGH').length;
    const mediumCount = issues.filter(i => i.priority_level === 'MEDIUM').length;
    const lowCount = issues.filter(i => i.priority_level === 'LOW').length;

    const pendingApprovals = issues.filter(i => i.status === 'PRIORITIZED').length;
    const activeAssignments = issues.filter(i => i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length;
    const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length;
    const criticalResolved = issues.filter(i => i.priority_level === 'CRITICAL' && i.status === 'RESOLVED').length;

    return {
      ...INITIAL_ANALYTICS,
      total_issues: issues.length,
      critical_issues: criticalCount,
      high_priority_issues: highCount,
      pending_approvals: pendingApprovals,
      active_assignments: activeAssignments,
      resolved_issues: resolvedCount,
      critical_resolved: criticalResolved,
      budget_utilized: resources.total_budget - resources.available_budget,
      budget_total: resources.total_budget,
      worker_utilization_pct: Math.round(((resources.total_workers - resources.available_workers) / resources.total_workers) * 100),
      vehicle_utilization_pct: Math.round(((resources.total_vehicles - resources.available_vehicles) / resources.total_vehicles) * 100),
      priority_distribution: [
        { level: 'CRITICAL', count: criticalCount, color: '#DC2626' },
        { level: 'HIGH', count: highCount, color: '#EA580C' },
        { level: 'MEDIUM', count: mediumCount, color: '#D97706' },
        { level: 'LOW', count: lowCount, color: '#16A34A' },
      ]
    };
  },

  resetToMockData(): void {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(INITIAL_RESOURCES));
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(INITIAL_ANALYTICS));
  }
};
